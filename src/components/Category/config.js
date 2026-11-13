// Category page definitions: routing slugs, SEO strings (unchanged from the
// pre-redesign route files), and the category-specific content of the approved
// category page design («Daisy Jewellery — Category Page Concept», 2026-11-10).
//
// Quick links («Добірки») are curated title searches inside the category: their
// label and search stem live here, their image and visibility come from the
// catalog (first matching product; hidden when nothing matches).

const BLOG = {
  ringSize: { uk: 'yak-vyznachyty-rozmir-kabluchky', ru: 'kak-uznat-razmer-kolca' },
  gifts: { uk: 'podarunok-na-8-bereznya', ru: 'podarok-na-8-marta' },
};

const blogHref = (post, lang) => `/${lang}/blog/${post[lang]}`;

export const QUICK = {
  clover: { q: 'клевер', uk: 'Клевер', ru: 'Клевер' },
  cz: { q: 'фіаніт', uk: 'З фіанітами', ru: 'С фианитами' },
  hearts: { q: 'серц', uk: 'Серця', ru: 'Сердца' },
  pearl: { q: 'перламутр', uk: 'Перламутр', ru: 'Перламутр' },
  gilded: { q: 'позолот', uk: 'Позолота', ru: 'Позолота' },
  minimal: { q: 'мінімаліст', uk: 'Мінімалізм', ru: 'Минимализм' },
  onyx: { q: 'онікс', uk: 'Онікс', ru: 'Оникс' },
  studs: { q: 'пусет', uk: 'Пусети', ru: 'Пусеты' },
  pendants: { q: 'підвіс', uk: 'Підвіски', ru: 'Подвески' },
  bismarck: { q: 'бісмарк', uk: 'Бісмарк', ru: 'Бисмарк' },
};

const giftService = {
  image: '/category/service-boxes.webp',
  imageAlt: {
    uk: 'Фірмові коробочки Daisy Jewellery зі срібними прикрасами',
    ru: 'Фирменные коробочки Daisy Jewellery с серебряными украшениями',
  },
  kicker: { uk: 'Сервіс Daisy', ru: 'Сервис Daisy' },
  title: { uk: 'Готово до подарунка', ru: 'Готово к подарку' },
  steps: {
    uk: [
      'Безкоштовне подарункове пакування до кожного замовлення',
      'Доставка Новою поштою по Україні за 1–3 дні',
      'Оплата онлайн через LiqPay або при отриманні на пошті',
    ],
    ru: [
      'Бесплатная подарочная упаковка к каждому заказу',
      'Доставка Новой почтой по Украине за 1–3 дня',
      'Оплата онлайн через LiqPay или при получении на почте',
    ],
  },
  cta: { uk: 'Доставка та оплата', ru: 'Доставка и оплата' },
  href: (lang) => `/${lang}/delivery`,
};

const giftEditorial = (image, imagePosition = '50% 30%') => ({
  image,
  imagePosition,
  kicker: { uk: 'Журнал Daisy', ru: 'Журнал Daisy' },
  title: { uk: 'Як обрати прикрасу в подарунок', ru: 'Как выбрать украшение в подарок' },
  text: {
    uk: 'Ідеї срібних подарунків до свята — і як зробити, щоб прикраса точно сподобалась.',
    ru: 'Идеи серебряных подарков к празднику — и как сделать, чтобы украшение точно понравилось.',
  },
  cta: { uk: 'Читати статтю', ru: 'Читать статью' },
  href: (lang) => blogHref(BLOG.gifts, lang),
});

export const CATEGORIES = {
  ring: {
    key: 'ring',
    slugs: { uk: 'kabluchki', ru: 'koltsa' },
    itemSlugs: { uk: 'kupyty-sribnu-kabluchku', ru: 'kupit-serebryanoye-koltso' },
    // src/dictionaries/{lang}.json → products[key]: per-product text overrides
    dictionaryKey: { uk: 'ring', ru: 'koltsa' },
    showSizes: true,
    jsonLdPrice: { low: 500, high: 1400 },
    name: { uk: 'Каблучки', ru: 'Кольца' },
    h1: { uk: 'Каблучки срібні', ru: 'Кольца серебряные' },
    seo: {
      uk: {
        title: 'Каблучки срібні | Купити срібні кільця Daisy Jewellery',
        description: 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні! Срібні кільця за найкращою ціною від виробника',
        keywords: 'Срібні каблучки, купити',
        jsonLdName: 'Срібні каблучки від Daisy Jewellery.',
        jsonLdDescription: 'Вишукані срібні каблучки від Daisy Jewellery. Швидка доставка по всій Україні!',
      },
      ru: {
        title: 'Кольца серебряные | Купить серебряные кольца Daisy Jewellery',
        description: 'Изысканные серебряные кольца от Daisy Jewellery. Быстрая доставка по всей Украине! Серебряные кольца по лучшей цене от производителя',
        keywords: 'Серебряные кольца, купить',
        jsonLdName: 'Серебряные кольца от Daisy Jewellery.',
        jsonLdDescription: 'Изысканные серебряные кольца от Daisy Jewellery. Быстрая доставка по всей Украине!',
      },
    },
    intro: {
      uk: 'Срібні каблучки від українського виробника — з клеймом, пробою та біркою на кожному виробі. Безкоштовне подарункове пакування до кожного замовлення.',
      ru: 'Серебряные кольца от украинского производителя — с клеймом, пробой и биркой на каждом изделии. Бесплатная подарочная упаковка к каждому заказу.',
    },
    seoBlock: {
      title: { uk: 'Срібні каблучки Daisy Jewellery', ru: 'Серебряные кольца Daisy Jewellery' },
      lead: {
        uk: 'Вишукані срібні каблучки від Daisy Jewellery — від мінімалістичних доріжок до колекції Клевер з перламутром та оніксом. Кожна прикраса виготовлена зі срібла 925 проби та має клеймо, пробу Держзразка й бірку.',
        ru: 'Изысканные серебряные кольца от Daisy Jewellery — от минималистичных дорожек до коллекции Клевер с перламутром и ониксом. Каждое украшение изготовлено из серебра 925 пробы и имеет клеймо, пробу Госпробы и бирку.',
      },
    },
    quickLinks: [QUICK.clover, QUICK.cz, QUICK.hearts, QUICK.pearl, QUICK.gilded, QUICK.minimal],
    priceChip: 1500,
    editorial: {
      image: '/category/editorial-rings.webp',
      imagePosition: '50% 30%',
      kicker: { uk: 'Гід Daisy', ru: 'Гид Daisy' },
      title: { uk: 'Як визначити розмір каблучки вдома', ru: 'Как определить размер кольца дома' },
      text: {
        uk: 'Три простих способи — ниткою, лінійкою або за каблучкою, яку ви вже носите.',
        ru: 'Три простых способа — ниткой, линейкой или по кольцу, которое вы уже носите.',
      },
      cta: { uk: 'Читати гід', ru: 'Читать гид' },
      href: (lang) => blogHref(BLOG.ringSize, lang),
    },
    service: {
      image: '/category/service-boxes.webp',
      imageAlt: giftService.imageAlt,
      kicker: { uk: 'Сервіс Daisy', ru: 'Сервис Daisy' },
      title: { uk: 'Не знаєте свій розмір?', ru: 'Не знаете свой размер?' },
      steps: {
        uk: [
          'Виміряйте внутрішній діаметр каблучки, яку ви вже носите',
          'Оберніть палець ниткою та звірте довжину з таблицею',
          'Замовте з післяплатою та приміряйте на пошті',
        ],
        ru: [
          'Измерьте внутренний диаметр кольца, которое вы уже носите',
          'Оберните палец ниткой и сверьте длину с таблицей',
          'Закажите с наложенным платежом и примерьте на почте',
        ],
      },
      cta: { uk: 'Таблиця розмірів', ru: 'Таблица размеров' },
      href: (lang) => blogHref(BLOG.ringSize, lang),
    },
    sizeGuideHref: (lang) => blogHref(BLOG.ringSize, lang),
  },

  earring: {
    key: 'earring',
    slugs: { uk: 'serezhky', ru: 'sergi' },
    itemSlugs: { uk: 'kupyty-serezhky-sribni', ru: 'kupit-serebryanyye-sergi' },
    dictionaryKey: { uk: '', ru: 'sergi' },
    showSizes: false,
    jsonLdPrice: { low: 400, high: 2200 },
    name: { uk: 'Сережки', ru: 'Серьги' },
    h1: { uk: 'Срібні сережки', ru: 'Серебряные серьги' },
    seo: {
      uk: {
        title: 'Срібні сережки | Купити срібні сережки Daisy Jewellery',
        description: 'Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні!',
        keywords: 'Срібні сережки, купити',
        jsonLdName: 'Срібні сережки від Daisy Jewellery',
        jsonLdDescription: 'Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні!',
      },
      ru: {
        title: 'Серебряные серьги | Купить серебряные серьги Daisy Jewellery',
        description: 'Серебряные серьги от Daisy Jewellery. Быстрая доставка по всей Украине!',
        keywords: 'Серебряные серьги, купить',
        jsonLdName: 'Серебряные серьги от Daisy Jewellery',
        jsonLdDescription: 'Серебряные серьги от Daisy Jewellery. Быстрая доставка по всей Украине!',
      },
    },
    intro: {
      uk: 'Срібні сережки від українського виробника — з клеймом, пробою та біркою на кожному виробі. Безкоштовне подарункове пакування до кожного замовлення.',
      ru: 'Серебряные серьги от украинского производителя — с клеймом, пробой и биркой на каждом изделии. Бесплатная подарочная упаковка к каждому заказу.',
    },
    seoBlock: {
      title: { uk: 'Срібні сережки Daisy Jewellery', ru: 'Серебряные серьги Daisy Jewellery' },
      lead: {
        uk: 'Срібні сережки від Daisy Jewellery — від мініатюрних пусет до колекції Клевер з перламутром та оніксом. Кожна прикраса виготовлена зі срібла 925 проби та має клеймо, пробу Держзразка й бірку.',
        ru: 'Серебряные серьги от Daisy Jewellery — от миниатюрных пусет до коллекции Клевер с перламутром и ониксом. Каждое украшение изготовлено из серебра 925 пробы и имеет клеймо, пробу Госпробы и бирку.',
      },
    },
    quickLinks: [QUICK.clover, QUICK.studs, QUICK.cz, QUICK.hearts, QUICK.onyx, QUICK.pearl],
    priceChip: 1500,
    editorial: giftEditorial('/home/category-earrings.webp', '50% 35%'),
    service: giftService,
  },

  necklace: {
    key: 'necklace',
    slugs: { uk: 'kolye', ru: 'kolye' },
    itemSlugs: { uk: 'kupyty-sribne-kolye', ru: 'kupit-serebryanoye-kolye' },
    dictionaryKey: { uk: '', ru: 'kolye' },
    showSizes: false,
    jsonLdPrice: { low: 500, high: 2800 },
    name: { uk: 'Кольє', ru: 'Колье' },
    h1: { uk: 'Срібні кольє', ru: 'Серебряные колье' },
    seo: {
      uk: {
        title: 'Срібні кольє | Купити срібне кольє Daisy Jewellery',
        description: 'Срібні кольє від Daisy Jewellery. Швидка доставка по всій Україні!',
        keywords: 'Срібні кольє, купити',
        jsonLdName: 'Срібні кольє від Daisy Jewellery',
        jsonLdDescription: 'Срібні кольє від Daisy Jewellery. Швидка доставка по всій Україні!',
      },
      ru: {
        title: 'Серебряные колье | Купить серебряное колье Daisy Jewellery',
        description: 'Серебряные колье от Daisy Jewellery. Быстрая доставка по всей Украине!',
        keywords: 'Серебряные колье, купить',
        jsonLdName: 'Серебряные колье от Daisy Jewellery',
        jsonLdDescription: 'Серебряные колье от Daisy Jewellery. Быстрая доставка по всей Украине!',
      },
    },
    intro: {
      uk: 'Срібні кольє від українського виробника — з клеймом, пробою та біркою на кожному виробі. Безкоштовне подарункове пакування до кожного замовлення.',
      ru: 'Серебряные колье от украинского производителя — с клеймом, пробой и биркой на каждом изделии. Бесплатная подарочная упаковка к каждому заказу.',
    },
    seoBlock: {
      title: { uk: 'Срібні кольє Daisy Jewellery', ru: 'Серебряные колье Daisy Jewellery' },
      lead: {
        uk: 'Срібні кольє від Daisy Jewellery — від лаконічних підвісок до колекції Клевер з перламутром та оніксом. Кожна прикраса виготовлена зі срібла 925 проби та має клеймо, пробу Держзразка й бірку.',
        ru: 'Серебряные колье от Daisy Jewellery — от лаконичных подвесок до коллекции Клевер с перламутром и ониксом. Каждое украшение изготовлено из серебра 925 пробы и имеет клеймо, пробу Госпробы и бирку.',
      },
    },
    quickLinks: [QUICK.clover, QUICK.cz, QUICK.hearts, QUICK.onyx, QUICK.pearl, QUICK.pendants],
    priceChip: 2000,
    editorial: giftEditorial('/categories/neclackle.webp', '50% 40%'),
    service: giftService,
  },

  bracer: {
    key: 'bracer',
    slugs: { uk: 'braslety', ru: 'braslety' },
    itemSlugs: { uk: 'kupyty-sribnyy-braslet', ru: 'kupit-serebryanyy-braslet' },
    dictionaryKey: { uk: '', ru: 'braslety' },
    showSizes: false,
    jsonLdPrice: { low: 650, high: 5400 },
    name: { uk: 'Браслети', ru: 'Браслеты' },
    h1: { uk: 'Срібні браслети', ru: 'Серебряные браслеты' },
    seo: {
      uk: {
        title: 'Срібні браслети | Купити срібний браслет Daisy Jewellery',
        description: 'Срібні браслети від Daisy Jewellery. Доставка в будь який куточок України. Купити срібний браслет від виробника за найкращою ціною',
        keywords: 'Срібні браслети, купити',
        jsonLdName: 'Срібні браслети від Daisy Jewellery',
        jsonLdDescription: 'Срібні браслети від Daisy Jewellery. Доставка в будь який куточок України. Купити срібний браслет від виробника за найкращою ціною',
      },
      ru: {
        title: 'Серебряные браслеты | Купить серебряный браслет Daisy Jewellery',
        description: 'Серебряные браслеты от Daisy Jewellery. Доставка по всей Украине. Купить серебряный браслет от производителя по лучшей цене',
        keywords: 'Серебряные браслеты, купить',
        jsonLdName: 'Серебряные браслеты от Daisy Jewellery',
        jsonLdDescription: 'Серебряные браслеты от Daisy Jewellery. Доставка по всей Украине. Купить серебряный браслет от производителя по лучшей цене',
      },
    },
    intro: {
      uk: 'Срібні браслети від українського виробника — з клеймом, пробою та біркою на кожному виробі. Безкоштовне подарункове пакування до кожного замовлення.',
      ru: 'Серебряные браслеты от украинского производителя — с клеймом, пробой и биркой на каждом изделии. Бесплатная подарочная упаковка к каждому заказу.',
    },
    seoBlock: {
      title: { uk: 'Срібні браслети Daisy Jewellery', ru: 'Серебряные браслеты Daisy Jewellery' },
      lead: {
        uk: 'Срібні браслети від Daisy Jewellery — від класичного бісмарку до колекції Клевер з оніксом і перламутром. Кожна прикраса виготовлена зі срібла 925 проби та має клеймо, пробу Держзразка й бірку.',
        ru: 'Серебряные браслеты от Daisy Jewellery — от классического бисмарка до коллекции Клевер с ониксом и перламутром. Каждое украшение изготовлено из серебра 925 пробы и имеет клеймо, пробу Госпробы и бирку.',
      },
    },
    quickLinks: [QUICK.clover, QUICK.onyx, QUICK.cz, QUICK.pearl, QUICK.hearts, QUICK.bismarck],
    priceChip: 2000,
    editorial: giftEditorial('/categories/bracer.webp', '50% 45%'),
    service: giftService,
  },
};

export const getCategoryConfig = (key) => CATEGORIES[key] || null;

/** Base URL of a category listing (`/uk/kabluchki`) and of its product pages. */
export function getCategoryUrls(config, lang) {
  const baseURL = `/${lang}/${config.slugs[lang]}`;
  return { baseURL, itemBaseURL: `${baseURL}/${config.itemSlugs[lang]}` };
}
