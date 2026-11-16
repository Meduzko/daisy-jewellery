#!/usr/bin/env node
// Configures the Directus admin panel over its REST API: Ukrainian labels, navigation, field
// interfaces, relations (translations / O2M / M2M), list layouts, the «Менеджер» role, public
// access to blog images, and the Flow that purges the Next.js cache after edits.
//
//   npm run cms:configure        (Directus must be running; re-run any time — idempotent)
//
// Only Directus metadata is written (directus.* tables). Table structure is never changed here,
// and the `directus` DB role could not change it anyway (db/directus/setup-db.sql).

for (const file of ['.env.local', '.env']) {
  try { process.loadEnvFile(file); } catch { /* missing */ }
}
const URL = (process.env.DIRECTUS_URL || 'http://localhost:8055').replace(/\/$/, '');
const { DIRECTUS_ADMIN_EMAIL: EMAIL, DIRECTUS_ADMIN_PASSWORD: PASSWORD, CATALOG_REVALIDATE_SECRET } = process.env;
const REVALIDATE_URL = process.env.DIRECTUS_REVALIDATE_URL || 'http://host.docker.internal:3000/api/catalog/revalidate';
if (!EMAIL || !PASSWORD) throw new Error('DIRECTUS_ADMIN_EMAIL / DIRECTUS_ADMIN_PASSWORD are not set');

let token;
async function api(method, path, body) {
  const res = await fetch(URL + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token && { authorization: `Bearer ${token}` }) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = res.status === 204 ? {} : await res.json();
  if (!res.ok) throw new Error(`${method} ${path}: ${res.status} ${JSON.stringify(json.errors ?? json)}`);
  return json.data;
}
const get = (path) => api('GET', path);

// ---------------------------------------------------------------- helpers
const uk = (translation, extra = {}) => [{ language: 'uk-UA', translation, ...extra }];
const choices = (pairs) => ({ choices: Object.entries(pairs).map(([value, text]) => ({ value, text })) });
const RO = { readonly: true };
const TS = { interface: 'datetime', display: 'datetime', readonly: true, width: 'half' };
// Values used in storefront URLs: editable when creating, then locked by PostgreSQL column grants
// (setup-db.sql). Not a form condition: in Directus 12 an `id is not null` rule also locks new items.
// `conditions: null` clears the condition set by earlier runs (PATCH merges field meta).
const DB_LOCKED = { conditions: null };
// product field → its product_attribute_values columns <slot>_product_id / <slot>_value_id (migration 20261116000003)
const ATTRIBUTE_FIELDS = [['metal', 'metals'], ['insertion', 'insertions'], ['coating', 'coatings'], ['other', 'other_attributes']];
const m2o = (template) => ({ interface: 'select-dropdown-m2o', options: { template }, display: 'related-values', display_options: { template } });

async function collection(name, label, meta = {}) {
  await api('PATCH', `/collections/${name}`, { meta: { translations: uk(label, { singular: label, plural: label }), ...meta } });
}

async function fields(c, defs) {
  const existing = new Set((await get(`/fields/${c}`)).map((f) => f.field));
  for (const [f, label, meta = {}] of defs) {
    const full = { translations: uk(label), ...meta };
    if (meta.special?.some((s) => ['o2m', 'm2m', 'translations', 'group'].includes(s)) && !existing.has(f)) {
      await api('POST', `/fields/${c}`, { field: f, type: 'alias', meta: full, schema: null });
    } else {
      await api('PATCH', `/fields/${c}/${f}`, { meta: full });
    }
  }
}

const relation = (c, f, meta) => api('PATCH', `/relations/${c}/${f}`, { meta });

/** Translations alias on `parent`, stored in `table` (fk → parent, locale → locales). */
async function translations(parent, table, fk, template) {
  await relation(table, fk, { one_field: 'translations', junction_field: 'locale', one_deselect_action: 'delete' });
  await relation(table, 'locale', { junction_field: fk });
  await fields(parent, [['translations', 'Тексти (uk / ru)', {
    special: ['translations'], interface: 'translations',
    options: { languageField: 'name', defaultLanguage: 'uk', userLanguage: false },
    display: 'translations', display_options: { template, languageField: 'name', defaultLanguage: 'uk' },
  }]]);
  await collection(table, 'Переклади', { hidden: true });
  await fields(table, [['id', 'ID', { hidden: true }], [fk, 'Запис', { hidden: true }], ['locale', 'Мова', { hidden: true }],
    ['created_at', 'Створено', { ...TS, hidden: true }], ['updated_at', 'Оновлено', { ...TS, hidden: true, special: ['date-updated'] }]]);
}

/** Global default list layout of a collection (columns + sort). */
async function layout(c, columns, sort, bookmarks = []) {
  const presets = await get(`/presets?filter[collection][_eq]=${c}&filter[user][_null]=true&filter[role][_null]=true&limit=-1`);
  const save = async (bookmark, filter) => {
    const body = { collection: c, bookmark, layout: 'tabular', filter, layout_query: { tabular: { fields: columns, sort, page: 1 } } };
    const hit = presets.find((p) => p.bookmark === bookmark);
    await (hit ? api('PATCH', `/presets/${hit.id}`, body) : api('POST', '/presets', body));
  };
  await save(null, null);
  for (const [name, filter] of bookmarks) await save(name, filter);
}

// ---------------------------------------------------------------- run
token = (await api('POST', '/auth/login', { email: EMAIL, password: PASSWORD })).access_token;

await api('PATCH', '/settings', {
  project_name: 'Daisy Jewellery',
  project_descriptor: 'Адмін-панель',
  project_url: process.env.NEXT_PUBLIC_BASE_URL || null,
  default_language: 'uk-UA',
  mcp_enabled: false,
});

// Folder for blog images (cover + images inside articles). Only this folder is public.
let [blogFolder] = await get('/folders?filter[name][_eq]=blog&limit=1');
blogFolder ??= await api('POST', '/folders', { name: 'blog' });
let [productsFolder] = await get('/folders?filter[name][_eq]=products&limit=1');
productsFolder ??= await api('POST', '/folders', { name: 'products' });

// Navigation: Товари › (тексти, розміри, постачальники, атрибути, колекції), Категорії,
// Замовлення › (платежі), Блог. Everything else is edited inside its parent form.
const nav = [
  ['products', 'Товари', { icon: 'diamond', sort: 1, archive_field: 'status', archive_value: 'archived', unarchive_value: 'active', archive_app_filter: true, display_template: '{{legacy_code}} · {{article}}' }],
  ['product_translations', 'Тексти товарів', { icon: 'translate', group: 'products', sort: 1, display_template: '{{locale}} · {{title}}' }],
  ['sizes', 'Розміри', { icon: 'straighten', group: 'products', sort: 2, display_template: '{{label}}' }],
  // product ↔ size links (+ DNTrade piece data: weight, stock); edited through the product's «Розміри»
  ['product_variants', 'Розміри товарів', { icon: 'straighten', group: 'products', sort: 7, hidden: true, display_template: '{{size_label}}' }],
  ['suppliers', 'Постачальники', { icon: 'local_shipping', group: 'products', sort: 3, display_template: '{{name}}' }],
  ['attributes', 'Атрибути (фільтри)', { icon: 'tune', group: 'products', sort: 4, display_template: '{{code}}' }],
  ['attribute_values', 'Значення атрибутів', { icon: 'label', group: 'products', sort: 5, display_template: '{{attribute_id.code}}: {{slug}}' }],
  ['collections', 'Колекції', { icon: 'collections_bookmark', group: 'products', sort: 6, display_template: '{{code}}' }],
  ['categories', 'Категорії', { icon: 'category', sort: 2, display_template: '{{code}}' }],
  ['orders', 'Замовлення', { icon: 'receipt_long', sort: 3, display_template: '№ {{number}} · {{buyer_last_name}} · {{total}} грн' }],
  ['payments', 'Платежі LiqPay', { icon: 'payments', group: 'orders', sort: 1, display_template: '{{liqpay_order_id}} · {{status}}' }],
  ['blog_posts', 'Блог', { icon: 'article', sort: 4, archive_field: 'status', archive_value: 'draft', unarchive_value: 'published', archive_app_filter: false }],
];
for (const [c, label, meta] of nav) await collection(c, label, meta);
for (const [c, label] of [['product_images', 'Фото товарів'], ['product_attribute_values', 'Атрибути товару'],
  ['collection_products', 'Товари колекції'], ['order_items', 'Позиції замовлення'], ['payment_events', 'Події LiqPay'], ['locales', 'Мови']]) {
  await collection(c, label, { hidden: true });
}

// ---- relations (FKs already exist in PostgreSQL; only Directus metadata is added)
await translations('products', 'product_translations', 'product_id', '{{title}}');
await collection('product_translations', 'Тексти товарів', { hidden: false, group: 'products', icon: 'translate', sort: 1, display_template: '{{locale}} · {{title}}' });
await translations('categories', 'category_translations', 'category_id', '{{name}}');
await translations('attributes', 'attribute_translations', 'attribute_id', '{{name}}');
await translations('attribute_values', 'attribute_value_translations', 'attribute_value_id', '{{value}}');
await translations('collections', 'collection_translations', 'collection_id', '{{name}}');
await translations('blog_posts', 'blog_post_translations', 'blog_post_id', '{{title}}');

// product_variants doubles as the product ↔ size junction (migration 20261116000003)
await relation('product_variants', 'product_id', { one_field: 'variants', junction_field: 'size_id', one_deselect_action: 'delete' });
await relation('product_variants', 'size_id', { junction_field: 'product_id' });
await relation('sizes', 'category_id', {});
await relation('product_images', 'product_id', { one_field: 'images', sort_field: 'sort_order' });
if (!(await get('/relations/product_images')).some((r) => r.field === 'file')) {
  throw new Error('product_images.file has no foreign key yet: run the migrations and db/directus/setup-db.sql, then restart Directus');
}
await relation('product_images', 'file', {});
await relation('attribute_values', 'attribute_id', { one_field: 'values', sort_field: 'sort_order' });
// One junction row per link; a trigger copies it into the column pair of its field (Матеріал / Вставка /
// Покриття / Інші), so each field lists only its own values. The app pairs the two sides of an M2M by
// `junction_field` both ways, hence a pair per field. The old combined field is removed.
if ((await get('/fields/products')).some((f) => f.field === 'attribute_values')) await api('DELETE', '/fields/products/attribute_values');
await relation('product_attribute_values', 'product_id', { one_field: null, junction_field: 'attribute_value_id' });
await relation('product_attribute_values', 'attribute_value_id', { junction_field: 'product_id' });
for (const [slot, alias] of ATTRIBUTE_FIELDS) {
  await relation('product_attribute_values', `${slot}_product_id`, { one_field: alias, junction_field: `${slot}_value_id`, one_deselect_action: 'delete' });
  await relation('product_attribute_values', `${slot}_value_id`, { junction_field: `${slot}_product_id` });
}
await relation('collection_products', 'product_id', { one_field: 'collections', junction_field: 'collection_id' });
await relation('collection_products', 'collection_id', { one_field: 'products', junction_field: 'product_id', sort_field: 'position' });
await relation('order_items', 'order_id', { one_field: 'items' });
await relation('payments', 'order_id', { one_field: 'payments' });
await relation('payment_events', 'payment_id', { one_field: 'events' });
// The FK is created by setup-db.sql (Directus 12 always adds a DB constraint for new relations).
if (!(await get('/relations/blog_posts')).some((r) => r.field === 'cover_image')) {
  throw new Error('blog_posts.cover_image has no foreign key yet: re-run db/directus/setup-db.sql now that Directus has started, then restart Directus');
}
await relation('blog_posts', 'cover_image', {});

// ---- fields
const PRODUCT_STATUS = choices({ active: 'Активний (на сайті)', draft: 'Чернетка', archived: 'Архів (знято з продажу)' });
const ORDER_STATUS = choices({ pending_payment: 'Очікує оплати', new: 'Нове', confirmed: 'Підтверджене', shipped: 'Відправлене', delivered: 'Доставлене', cancelled: 'Скасоване', returned: 'Повернене' });
const PAYMENT_STATUS = choices({ pending: 'Очікує', success: 'Успішний', failure: 'Помилка', refunded: 'Повернено' });
const money = (label) => [label, { interface: 'input', width: 'half', options: { min: 0 }, display: 'formatted-value', display_options: { suffix: ' грн' } }];

// Product form: sections (group-detail) in this order; `sort` follows the list order.
const group = (label, start = 'open') => [label, { special: ['alias', 'no-data', 'group'], interface: 'group-detail', options: { start }, width: 'full' }];
const attributeField = (slot, label, filter, note) => [label, { special: ['m2m'], interface: 'list-m2m', note,
  options: { template: `{{${slot}_value_id.translations.value}}`, enableCreate: false, filter: { _and: [{ attribute_id: { code: filter } }] } } }];
const PRODUCT_FORM = [
  ['group_main', ...group('Основна інформація')],
  ['legacy_code', 'Код (у URL товару)', { width: 'half', readonly: true, required: false, note: 'Генерується автоматично під час створення й більше не змінюється', ...DB_LOCKED }],
  ['status', 'Статус', { interface: 'select-dropdown', options: PRODUCT_STATUS, display: 'labels', display_options: PRODUCT_STATUS, width: 'half' }],
  ['category_id', 'Категорія', { ...m2o('{{code}}'), width: 'half', required: true }],
  ['article', 'Артикул', { width: 'half', note: 'Однаковий артикул об’єднує розміри каблучок' }],
  ['group_texts', ...group('Назва, опис і SEO (uk / ru)')],
  ['translations', null, {}], // label/interface set by translations()
  ['group_specs', ...group('Характеристики')],
  ['metals', ...attributeField('metal', 'Матеріал', { _eq: 'metal' })],
  ['insertions', ...attributeField('insertion', 'Вставка', { _eq: 'insertion' }, 'Можна обрати кілька. Нове значення — «Товари › Атрибути»')],
  ['coatings', ...attributeField('coating', 'Покриття', { _eq: 'coating' })],
  ['other_attributes', ...attributeField('other', 'Інші характеристики (колір вставки, застібка…)', { _nin: ['metal', 'insertion', 'coating'] })],
  ['variants', 'Розміри', { special: ['m2m'], interface: 'list-m2m', note: 'Показуються розміри категорії товару (спершу збережіть категорію). Нові розміри — «Товари › Розміри»',
    options: { template: '{{size_id.label}}', enableCreate: false, filter: { _and: [{ category_id: { _eq: '{{category_id}}' } }] } } }],
  ['avg_weight_g', 'Середня вага, г', { interface: 'input', width: 'half' }],
  ['group_prices', ...group('Ціни')],
  ['price', ...money('Ціна')],
  ['discount_percent', 'Знижка, %', { interface: 'input', width: 'half', options: { min: 0, max: 100, step: 1 }, note: '0 = без знижки',
    display: 'formatted-value', display_options: { suffix: ' %' } }],
  ['sale_price', 'Ціна зі знижкою', { ...RO, interface: 'input', width: 'half', note: 'Рахується автоматично після збереження: ціна − знижка, до копійок',
    display: 'formatted-value', display_options: { suffix: ' грн' } }],
  ['group_images', ...group('Зображення')],
  ['images', 'Фото (перше = головне; перетягніть, щоб змінити порядок)', { special: ['o2m'], interface: 'list-o2m', options: { template: '{{file.$thumbnail}} {{sort_order}} · {{file.filename_download}}{{url}}' } }],
  ['group_more', ...group('Додатково', 'closed')],
  ['collections', 'Колекції (новинки, популярне…)', { special: ['m2m'], interface: 'list-m2m', options: { template: '{{collection_id.code}}', enableCreate: false } }],
  ['supplier_id', 'Постачальник', { ...m2o('{{name}}'), width: 'half' }],
  ['legacy_id', 'DNTrade GUID', { width: 'half', note: 'Потрібен, щоб замовлення товару передавалось у DNTrade', ...DB_LOCKED }],
  ['note', 'Примітка (внутрішня)', { interface: 'input-multiline' }],
  ['source_created_at', 'Створено в DNTrade', TS],
  ['updated_at', 'Оновлено', { ...TS, special: ['date-updated'] }],
  ['id', 'ID', { ...RO, hidden: true }],
  ['created_at', 'Створено', { ...TS, hidden: true }],
];
{
  let section = null;
  const defs = PRODUCT_FORM.map(([f, label, meta], i) => {
    if (f.startsWith('group_')) section = f;
    const extra = { sort: i + 1, ...(f.startsWith('group_') || meta.hidden ? {} : { group: section }) };
    return [f, label, { ...meta, ...extra }];
  });
  // translations keeps the label/interface from translations(); only its place is set here
  const [, , tMeta] = defs.find(([f]) => f === 'translations');
  await api('PATCH', '/fields/products/translations', { meta: tMeta });
  await fields('products', defs.filter(([f]) => f !== 'translations'));
}
await fields('product_attribute_values', [
  ['id', 'ID', { hidden: true }], ['product_id', 'Товар', { hidden: true }],
  ...ATTRIBUTE_FIELDS.flatMap(([slot]) => [[`${slot}_product_id`, 'Товар', { hidden: true }], [`${slot}_value_id`, 'Значення', { hidden: true }]]),
  ['attribute_value_id', 'Значення', m2o('{{attribute_id.code}}: {{translations.value}}')],
]);
await fields('product_translations', [
  ['title', 'Назва', { required: true }],
  ['slug', 'Slug', { required: false, note: 'Порожньо = створюється з назви автоматично (транслітерація + код). Після створення не змінюється сам',
    validation: { _and: [{ slug: { _regex: '^([a-z0-9]+(-[a-z0-9]+)*)?$' } }] }, validation_message: 'Лише малі латинські літери, цифри й дефіси' }],
  ['short_description', 'Короткий опис', { interface: 'input-multiline' }],
  ['description', 'Опис', { interface: 'input-multiline' }],
  ['seo_title', 'SEO title', {}],
  ['seo_description', 'SEO description', { interface: 'input-multiline' }],
  // Not 'required': in the product form these are filled by Directus after the product is saved, and the form
  // check runs before that. PostgreSQL (NOT NULL) still rejects a text without product or language.
  ['product_id', 'Товар', { ...m2o('{{legacy_code}} · {{article}}'), hidden: false, required: false, width: 'half', ...DB_LOCKED }],
  ['locale', 'Мова', { ...m2o('{{name}}'), hidden: false, required: false, width: 'half', ...DB_LOCKED }],
]);
// Product ↔ size link. Only the size is edited; label/number are copied from it by a trigger, and the
// DNTrade piece data (weight, stock, cost, codes) stays in the table, out of the form.
await fields('product_variants', [
  ['id', 'ID', { ...RO, hidden: true }],
  ['product_id', 'Товар', { ...m2o('{{legacy_code}} · {{article}}'), hidden: true }],
  ['size_id', 'Розмір', m2o('{{label}}')],
  ...[['size_label', 'Розмір (як на сайті)'], ['size', 'Розмір (число)'], ['weight_g', 'Вага, г'], ['price', 'Ціна (якщо інша)'],
    ['cost_price', 'Закупівельна ціна'], ['stock_qty', 'Залишок'], ['legacy_id', 'DNTrade GUID'], ['legacy_code', 'DNTrade код'],
    ['barcode', 'Штрихкод'], ['created_at', 'Створено'], ['updated_at', 'Оновлено']].map(([f, l]) => [f, l, { hidden: true }]),
]);
await fields('sizes', [
  ['id', 'ID', { ...RO, hidden: true }],
  ['category_id', 'Тип товару', { ...m2o('{{code}}'), required: true, width: 'half' }],
  ['label', 'Розмір', { required: true, width: 'half', note: 'Як на сайті: 17, 17,5, 16 см, 17–20 см. Один розмір на тип товару' }],
  ['value', 'Число', { ...RO, hidden: true }],
  ['sort_value', 'Порядок', { ...RO, hidden: true }],
  ['created_at', 'Створено', { ...TS, hidden: true }],
  ['updated_at', 'Оновлено', { ...TS, hidden: true, special: ['date-updated'] }],
]);
await fields('product_images', [
  ['id', 'ID', { hidden: true }], ['product_id', 'Товар', { hidden: true }],
  ['file', 'Фото', { special: ['file'], interface: 'file-image', options: { folder: productsFolder.id }, display: 'image',
    note: 'JPEG, PNG або WebP — зберігається в Cloudflare R2 без змін. Щоб замінити фото, завантажте новий файл тут (не «Замінити файл» у бібліотеці).' }],
  ['url', 'URL фото (DNTrade)', { note: 'Лише для старих фото з cdn.dntrade.com.ua; для нових завантажте файл', readonly: true }],
  ['r2_key', 'Ключ у R2', { readonly: true, note: 'Заповнюється автоматично' }],
  ['sort_order', 'Порядок (0 = головне)', {}],
  ['created_at', 'Створено', { ...TS, hidden: true }],
]);
await fields('suppliers', [
  ['id', 'ID', { hidden: true }], ['name', 'Назва', { required: true }], ['contact', 'Контакт', { interface: 'input-multiline' }],
  ['legacy_id', 'DNTrade id', RO], ['created_at', 'Створено', { ...TS, hidden: true }],
  ['updated_at', 'Оновлено', { ...TS, hidden: true, special: ['date-updated'] }],
]);
await fields('attributes', [
  ['id', 'ID', { hidden: true }], ['code', 'Код', { ...DB_LOCKED, note: 'Ключ фільтра в URL' }],
  ['is_filterable', 'Показувати у фільтрах', { interface: 'boolean', width: 'half' }], ['sort_order', 'Порядок', { width: 'half' }],
  ['values', 'Значення', { special: ['o2m'], interface: 'list-o2m', options: { template: '{{slug}}' } }],
  ['created_at', 'Створено', { ...TS, hidden: true }], ['updated_at', 'Оновлено', { ...TS, hidden: true, special: ['date-updated'] }],
]);
await fields('attribute_values', [
  ['id', 'ID', { hidden: true }], ['attribute_id', 'Атрибут', m2o('{{code}}')],
  ['slug', 'Slug (у URL фільтра)', { ...DB_LOCKED, note: 'Латиницею, напр. fianit' }], ['sort_order', 'Порядок', {}],
  ['legacy_id', 'DNTrade id', RO], ['created_at', 'Створено', { ...TS, hidden: true }],
  ['updated_at', 'Оновлено', { ...TS, hidden: true, special: ['date-updated'] }],
]);
await fields('collections', [
  ['id', 'ID', { hidden: true }], ['code', 'Код', DB_LOCKED], ['is_active', 'Активна', { interface: 'boolean', width: 'half' }],
  ['sort_order', 'Порядок', { width: 'half' }],
  ['products', 'Товари', { special: ['m2m'], interface: 'list-m2m', options: { template: '{{product_id.legacy_code}} · {{product_id.article}}', enableCreate: false } }],
  ['created_at', 'Створено', { ...TS, hidden: true }], ['updated_at', 'Оновлено', { ...TS, hidden: true, special: ['date-updated'] }],
]);
await fields('categories', [
  ['id', 'ID', { hidden: true }], ['code', 'Код', { ...RO, note: 'Категорії прив’язані до сторінок сайту — нові додаються розробником' }],
  ['is_active', 'Активна', { interface: 'boolean', width: 'half' }], ['sort_order', 'Порядок', { width: 'half' }],
  ['created_at', 'Створено', { ...TS, hidden: true }], ['updated_at', 'Оновлено', { ...TS, special: ['date-updated'] }],
]);
await fields('category_translations', [
  ['name', 'Назва', {}], ['slug', 'Slug (URL)', RO], ['url_prefix', 'Префікс URL', RO],
  ['description', 'Опис (SEO-блок)', { interface: 'input-multiline' }], ['seo_title', 'SEO title', {}],
  ['seo_description', 'SEO description', { interface: 'input-multiline' }],
]);
await fields('attribute_translations', [['name', 'Назва', {}]]);
await fields('attribute_value_translations', [['value', 'Значення', {}]]);
await fields('collection_translations', [['name', 'Назва', {}], ['slug', 'Slug', {}], ['description', 'Опис', { interface: 'input-multiline' }]]);

await fields('orders', [
  ['id', 'ID', { ...RO, hidden: true }],
  ['number', '№ замовлення', { ...RO, width: 'half' }],
  ['status', 'Статус', { interface: 'select-dropdown', options: ORDER_STATUS, display: 'labels', display_options: ORDER_STATUS, width: 'half' }],
  ['access_token', 'Токен доступу', { ...RO, hidden: true }],
  ['locale', 'Мова', { ...RO, width: 'half' }],
  ['payment_method', 'Оплата', { ...RO, width: 'half', interface: 'select-dropdown', options: choices({ card: 'Картка (LiqPay)', cod: 'Накладений платіж' }), display: 'labels', display_options: choices({ card: 'Картка (LiqPay)', cod: 'Накладений платіж' }) }],
  ...[['buyer_first_name', 'Ім’я'], ['buyer_last_name', 'Прізвище'], ['buyer_phone', 'Телефон'], ['buyer_email', 'Email'],
    ['contact_channel', 'Зв’язок'], ['recipient_first_name', 'Отримувач: ім’я'], ['recipient_last_name', 'Отримувач: прізвище'],
    ['recipient_phone', 'Отримувач: телефон'], ['np_city_name', 'НП: місто'], ['np_warehouse_name', 'НП: відділення'],
    ['np_city_ref', 'НП: ref міста'], ['np_warehouse_ref', 'НП: ref відділення']].map(([f, l]) => [f, l, { ...RO, width: 'half' }]),
  ['np_ttn', 'ТТН Нової Пошти', { width: 'half' }],
  ['items_total', 'Сума товарів', { ...RO, width: 'half' }],
  ['delivery_cost', 'Доставка', { ...RO, width: 'half' }],
  ['total', 'Разом', { ...RO, width: 'half', display: 'formatted-value', display_options: { suffix: ' грн' } }],
  ['comment', 'Коментар', { interface: 'input-multiline' }],
  ['paid_at', 'Оплачено', TS], ['shipped_at', 'Відправлено', { ...TS, readonly: false }],
  ['cancelled_at', 'Скасовано', { ...TS, readonly: false }], ['created_at', 'Створено', TS],
  ['updated_at', 'Оновлено', { ...TS, special: ['date-updated'] }],
  ['items', 'Товари', { special: ['o2m'], interface: 'list-o2m', readonly: true, options: { template: '{{product_title}} · {{size_label}} · {{quantity}} × {{unit_price}} грн', enableCreate: false, enableSelect: false } }],
  ['payments', 'Платежі', { special: ['o2m'], interface: 'list-o2m', readonly: true, options: { template: '{{liqpay_order_id}} · {{status}} · {{amount}} {{currency}}', enableCreate: false, enableSelect: false } }],
]);
await fields('order_items', [['product_title', 'Товар', RO], ['article', 'Артикул', RO], ['size_label', 'Розмір', RO], ['weight_g', 'Вага', RO],
  ['unit_price', 'Ціна', RO], ['original_price', 'Ціна без знижки', RO], ['quantity', 'К-сть', RO], ['variant_id', 'Варіант', { ...RO, ...m2o('{{size_label}}') }]]);
await fields('payments', [
  ['order_id', 'Замовлення', { ...RO, ...m2o('№ {{number}}') }], ['liqpay_order_id', 'LiqPay order_id', RO], ['liqpay_payment_id', 'LiqPay payment_id', RO],
  ['amount', 'Сума', RO], ['currency', 'Валюта', RO],
  ['status', 'Статус', { ...RO, interface: 'select-dropdown', options: PAYMENT_STATUS, display: 'labels', display_options: PAYMENT_STATUS }],
  ['paid_at', 'Оплачено', TS], ['refunded_at', 'Повернено', TS], ['created_at', 'Створено', TS], ['updated_at', 'Оновлено', TS],
  ['events', 'Події', { special: ['o2m'], interface: 'list-o2m', readonly: true, options: { template: '{{received_at}} · {{source}}', enableCreate: false, enableSelect: false } }],
]);
await fields('payment_events', [['payload', 'Дані LiqPay', { ...RO, interface: 'input-code', options: { language: 'JSON' } }]]);

const BLOG_STATUS = choices({ draft: 'Чернетка', published: 'Опубліковано' });
await fields('blog_posts', [
  ['id', 'ID', { ...RO, hidden: true }],
  ['status', 'Статус', { interface: 'select-dropdown', options: BLOG_STATUS, display: 'labels', display_options: BLOG_STATUS, width: 'half' }],
  ['published_at', 'Дата публікації', { interface: 'datetime', display: 'datetime', width: 'half', note: 'Порожньо = дата створення' }],
  ['cover_image', 'Обкладинка', { special: ['file'], interface: 'file-image', options: { folder: blogFolder.id }, display: 'image' }],
  ['created_at', 'Створено', { ...TS, hidden: true }],
  ['updated_at', 'Оновлено', { ...TS, special: ['date-updated'] }],
]);
await fields('blog_post_translations', [
  ['title', 'Заголовок (H1)', { required: true }],
  ['slug', 'Slug (URL статті)', { required: true, options: { slug: true, trim: true }, note: 'Латиницею через дефіс: yak-obraty-kabluchku',
    validation: { _and: [{ slug: { _regex: '^[a-z0-9]+(-[a-z0-9]+)*$' } }] }, validation_message: 'Лише малі латинські літери, цифри й дефіси' }],
  ['excerpt', 'Анонс (у списку статей)', { interface: 'input-multiline' }],
  ['content', 'Текст статті', { interface: 'input-rich-text-html', options: { folder: blogFolder.id } }],
  ['seo_title', 'SEO title', { note: 'Порожньо = заголовок' }],
  ['seo_description', 'SEO description', { interface: 'input-multiline' }],
]);

// ---- list layouts
// Category filter: the native filter on «Категорія» works on any column; these bookmarks are one-click presets.
const byCategory = (code) => ({ _and: [{ category_id: { code: { _eq: code } } }] });
await layout('products', ['legacy_code', 'translations', 'category_id', 'price', 'discount_percent', 'sale_price', 'status'], ['-id'],
  [['Каблучки', byCategory('rings')], ['Сережки', byCategory('earrings')], ['Кольє', byCategory('necklaces')], ['Браслети', byCategory('bracelets')]]);
await layout('sizes', ['category_id', 'label'], ['category_id', 'sort_value', 'label']);
await layout('product_translations', ['product_id', 'locale', 'title', 'seo_title'], ['product_id']);
await layout('product_variants', ['product_id', 'size_id'], ['product_id']);
await layout('categories', ['code', 'translations', 'is_active', 'sort_order'], ['sort_order']);
await layout('orders', ['number', 'status', 'buyer_last_name', 'buyer_phone', 'payment_method', 'total', 'created_at'], ['-created_at'],
  [['Нові', { _and: [{ status: { _eq: 'new' } }] }], ['Очікують оплати', { _and: [{ status: { _eq: 'pending_payment' } }] }]]);
await layout('payments', ['liqpay_order_id', 'order_id', 'status', 'amount', 'created_at'], ['-created_at']);
await layout('blog_posts', ['translations', 'status', 'published_at', 'updated_at'], ['-published_at']);

// ---- «Менеджер» role: catalog + blog editing, orders read-only except fulfilment fields.
// Directus Free accepts only "all fields, all items" permissions (field lists and item filters
// need a paid licence key), so column-level limits — order payment data, URL slugs/codes — are
// PostgreSQL grants in setup-db.sql and apply to every CMS user.
const POLICY = 'Менеджер магазину';
let [policy] = await get(`/policies?filter[name][_eq]=${encodeURIComponent(POLICY)}&limit=1`);
policy ??= await api('POST', '/policies', { name: POLICY, icon: 'storefront', admin_access: false, app_access: true, enforce_tfa: false });
const old = await get(`/permissions?filter[policy][_eq]=${policy.id}&limit=-1&fields=id`);
if (old.length) await api('DELETE', '/permissions', old.map((p) => p.id));
const perms = [];
const allow = (collections, actions, extra = {}) => {
  for (const collection of collections) for (const action of actions) perms.push({ policy: policy.id, collection, action, fields: ['*'], ...extra });
};
allow(['products', 'suppliers', 'attributes', 'attribute_translations', 'attribute_values', 'attribute_value_translations',
  'collections', 'collection_translations', 'category_translations'], ['create', 'read', 'update']);
allow(['product_translations', 'product_variants', 'product_images', 'product_attribute_values', 'collection_products', 'sizes',
  'blog_posts', 'blog_post_translations'], ['create', 'read', 'update', 'delete']);
allow(['categories', 'orders'], ['read', 'update']); // DB allows only status/TTN/comment/dates on orders
allow(['locales', 'order_items', 'payments', 'payment_events'], ['read']);
allow(['directus_files'], ['create', 'read', 'update']);
allow(['directus_folders'], ['read']);
await api('POST', '/permissions', perms);

let [role] = await get(`/roles?filter[name][_eq]=${encodeURIComponent('Менеджер')}&limit=1&fields=id,policies.policy`);
if (!role) await api('POST', '/roles', { name: 'Менеджер', icon: 'badge', policies: [{ policy: policy.id }] });
else if (!role.policies.some((p) => p.policy === policy.id)) await api('PATCH', `/roles/${role.id}`, { policies: { create: [{ policy: policy.id }] } });

// ---- Public: read files only (blog covers and article images load from /assets/<id>). No
// collection is public. shortcut: Free tier can't limit this to the blog folder, so every file
// uploaded to Directus is public by URL — upload only website images; proxy via Next.js if that changes.
const [publicPolicy] = await get('/policies?filter[name][_eq]=$t:public_label&limit=1');
const publicPerms = await get(`/permissions?filter[policy][_eq]=${publicPolicy.id}&limit=-1&fields=id`);
if (publicPerms.length) await api('DELETE', '/permissions', publicPerms.map((p) => p.id));
await api('POST', '/permissions', [{ policy: publicPolicy.id, collection: 'directus_files', action: 'read', fields: ['*'] }]);

// ---- Flow: purge the storefront cache (catalog + blog) after every edit
const FLOW = 'Оновити кеш сайту';
const FLOW_COLLECTIONS = ['products', 'product_translations', 'product_variants', 'sizes', 'product_images', 'product_attribute_values',
  'categories', 'category_translations', 'attributes', 'attribute_translations', 'attribute_values', 'attribute_value_translations',
  'collections', 'collection_translations', 'collection_products', 'suppliers', 'blog_posts', 'blog_post_translations'];
if (!CATALOG_REVALIDATE_SECRET) {
  console.warn('CATALOG_REVALIDATE_SECRET is not set — Flow skipped; the site picks up edits within 15 minutes.');
} else {
  const opOptions = { method: 'POST', url: REVALIDATE_URL, headers: [{ header: 'Authorization', value: `Bearer ${CATALOG_REVALIDATE_SECRET}` }] };
  const flowBody = { name: FLOW, icon: 'sync', status: 'active', trigger: 'event', accountability: null,
    options: { type: 'action', scope: ['items.create', 'items.update', 'items.delete'], collections: FLOW_COLLECTIONS } };
  let [flow] = await get(`/flows?filter[name][_eq]=${encodeURIComponent(FLOW)}&limit=1&fields=id,operation`);
  if (!flow) flow = await api('POST', '/flows', flowBody);
  else await api('PATCH', `/flows/${flow.id}`, flowBody);
  if (flow.operation) await api('PATCH', `/operations/${flow.operation}`, { options: opOptions });
  else {
    const op = await api('POST', '/operations', { flow: flow.id, name: 'POST /api/catalog/revalidate', key: 'revalidate', type: 'request', position_x: 19, position_y: 1, options: opOptions });
    await api('PATCH', `/flows/${flow.id}`, { operation: op.id });
  }
}

console.log(`Directus configured: ${URL}  (blog folder ${blogFolder.id}, manager policy ${policy.id})`);
