// Small deterministic catalog used by the tests (independent of the real import data).

export async function seedCatalog(db) {
  const cat = {};
  for (const [code, sort, uk, ru, active] of [
    ['rings', 1, ['Каблучки', 'kabluchki'], ['Кольца', 'koltsa'], true],
    ['earrings', 2, ['Сережки', 'serezhky'], ['Серьги', 'sergi'], true],
    ['necklaces', 3, ['Кольє', 'kolye'], null, true],
    ['bracelets', 4, ['Браслети', 'braslety'], ['Браслеты', 'braslety'], false],
  ]) {
    const [{ id }] = await db('categories').insert({ code, sort_order: sort, is_active: active }).returning('id');
    cat[code] = id;
    await db('category_translations').insert({ category_id: id, locale: 'uk', name: uk[0], slug: uk[1] });
    if (ru) await db('category_translations').insert({ category_id: id, locale: 'ru', name: ru[0], slug: ru[1] });
  }

  const [{ id: supplierId }] = await db('suppliers').insert({ name: 'Secret Supplier', contact: '+380000000000' }).returning('id');

  // code, category, article, price, sale, status, uk title, ru title|null, created
  const rows = [
    ['100', 'rings', '2069р', '1600.00', null, 'active', 'Срібна каблучка Клевер', 'Серебряное кольцо Клевер', '2024-01-10'],
    ['20', 'rings', '2069р ', '1200.00', '900.00', 'active', 'Каблучка Серце з фіанітами', null, '2024-05-01'],
    ['3', 'rings', '508-родовано', '2200.00', null, 'active', 'Каблучка 100% срібло_925', null, '2023-02-01'],
    ['4', 'rings', 'X1', '800.00', null, 'draft', 'Чернетка каблучки', null, '2024-06-01'],
    ['5', 'rings', 'X2', null, null, 'active', 'Каблучка без ціни', null, '2024-06-02'],
    ['6', 'earrings', '508-родовано', '1500.00', null, 'active', 'Сережки Клевер онікс', 'Серьги Клевер оникс', '2024-03-03'],
    ['7', 'earrings', 'E7', '500.00', null, 'active', 'Пусети Серце', null, '2024-07-07'],
    ['8', 'bracelets', 'B8', '1000.00', null, 'active', 'Браслет у прихованій категорії', null, '2024-08-08'],
    ['9', 'necklaces', 'N9', '3000.00', '2700.00', 'active', 'Кольє Клевер', null, '2022-12-12'],
  ];
  const ids = {};
  for (const [code, category, article, price, sale, status, uk, ru, created] of rows) {
    const [{ id }] = await db('products').insert({
      category_id: cat[category], supplier_id: supplierId, legacy_code: code, legacy_id: code === '100' ? 'GUID-100' : null,
      article, price, sale_price: sale, status, source_created_at: created,
    }).returning('id');
    ids[code] = id;
    await db('product_translations').insert({
      product_id: id, locale: 'uk', title: uk, slug: `uk-${code}`, short_description: `<p>Опис ${code}</p>`,
    });
    if (ru) await db('product_translations').insert({ product_id: id, locale: 'ru', title: ru, slug: `ru-${code}` });
    await db('product_images').insert([
      { product_id: id, url: `https://cdn.example/${code}-b.jpg`, sort_order: 1 },
      { product_id: id, url: `https://cdn.example/${code}-a.jpg`, sort_order: 0 },
    ]);
  }

  // variants: ring sizes (pieces), cost price must never leak
  const v = (code, size, stock, extra = {}) => ({
    product_id: ids[code], size_label: size == null ? null : String(size).replace('.', ','), size, stock_qty: stock, cost_price: '123.45', ...extra,
  });
  await db('product_variants').insert([
    v('100', 17, 1), v('100', 17.5, 0), v('100', 16.5, null),
    v('20', 18, 1), v('20', 17, 0),
    v('3', 19, 0),
    v('6', null, null),
    v('7', null, 0),
    v('9', 45, null, { size_label: '45 см' }),
  ]);

  // collections
  const [{ id: popular }] = await db('collections').insert({ code: 'popular', sort_order: 2 }).returning('id');
  const [{ id: clover }] = await db('collections').insert({ code: 'clover', sort_order: 1 }).returning('id');
  const [{ id: hidden }] = await db('collections').insert({ code: 'hidden', is_active: false }).returning('id');
  await db('collection_translations').insert([
    { collection_id: popular, locale: 'uk', name: 'Популярне', slug: 'populiarne' },
    { collection_id: clover, locale: 'uk', name: 'Клевер', slug: 'klever' },
    { collection_id: hidden, locale: 'uk', name: 'Приховано', slug: 'hidden' },
  ]);
  await db('collection_products').insert([
    { collection_id: popular, product_id: ids['20'] },
    { collection_id: clover, product_id: ids['100'] },
    { collection_id: clover, product_id: ids['6'] },
    { collection_id: clover, product_id: ids['9'] },
    { collection_id: hidden, product_id: ids['7'] },
  ]);

  // attributes
  // `insertion` (and the other spec attributes) are seeded by migration 2.
  const { id: insertion } = await db('attributes').where({ code: 'insertion' }).first('id');
  const [{ id: internal }] = await db('attributes').insert({ code: 'internal', is_filterable: false }).returning('id');
  await db('attribute_translations').insert([
    { attribute_id: insertion, locale: 'uk', name: 'Вставка' },
    { attribute_id: insertion, locale: 'ru', name: 'Вставка (ru)' },
    { attribute_id: internal, locale: 'uk', name: 'Службове' },
  ]).onConflict(['attribute_id', 'locale']).merge(['name']);
  const [{ id: onyx }] = await db('attribute_values').insert({ attribute_id: insertion, slug: 'oniks' }).returning('id');
  const [{ id: cz }] = await db('attribute_values').insert({ attribute_id: insertion, slug: 'fianit' }).returning('id');
  const [{ id: x }] = await db('attribute_values').insert({ attribute_id: internal, slug: 'x' }).returning('id');
  await db('attribute_value_translations').insert([
    { attribute_value_id: onyx, locale: 'uk', value: 'онікс' },
    { attribute_value_id: onyx, locale: 'ru', value: 'оникс' },
    { attribute_value_id: cz, locale: 'uk', value: 'фіаніт' },
    { attribute_value_id: x, locale: 'uk', value: 'x' },
  ]);
  await db('product_attribute_values').insert([
    { product_id: ids['100'], attribute_value_id: onyx },
    { product_id: ids['3'], attribute_value_id: onyx },
    { product_id: ids['20'], attribute_value_id: cz },
    { product_id: ids['6'], attribute_value_id: onyx },
    { product_id: ids['100'], attribute_value_id: x },
  ]);

  return { ids, cat };
}
