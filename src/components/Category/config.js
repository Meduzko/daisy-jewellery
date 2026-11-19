// Presentation extras of the category pages (approved design «Daisy Jewellery — Category Page
// Concept», 2026-11-10): editorial tile, service band, quick links, size guide, dictionary keys.
// Category data itself (names, slugs, H1, SEO, visibility, order) lives in PostgreSQL and is edited
// in Directus (src/lib/catalog/categories.js). Categories without an entry here get DEFAULT_EXTRAS.
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


const DEFAULT_EXTRAS = {
  // src/dictionaries/{lang}.json → products[key]: per-product text overrides (none for new categories)
  dictionaryKey: { uk: '', ru: '' },
  showSizes: 'auto',
  quickLinks: [],
  priceChip: null,
  editorial: null,
  service: giftService,
  sizeGuideHref: null,
};

// Keyed by storefront category key (src/lib/catalog/categories.js).
const EXTRAS = {
  ring: {
    dictionaryKey: { uk: 'ring', ru: 'koltsa' },
    showSizes: true,
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
    dictionaryKey: { uk: '', ru: 'sergi' },
    showSizes: false,
    quickLinks: [QUICK.clover, QUICK.studs, QUICK.cz, QUICK.hearts, QUICK.onyx, QUICK.pearl],
    priceChip: 1500,
    editorial: giftEditorial('/home/category-earrings.webp', '50% 35%'),
    service: giftService,
  },

  necklace: {
    dictionaryKey: { uk: '', ru: 'kolye' },
    showSizes: false,
    quickLinks: [QUICK.clover, QUICK.cz, QUICK.hearts, QUICK.onyx, QUICK.pearl, QUICK.pendants],
    priceChip: 2000,
    editorial: giftEditorial('/categories/neclackle.webp', '50% 40%'),
    service: giftService,
  },

  bracer: {
    dictionaryKey: { uk: '', ru: 'braslety' },
    showSizes: false,
    quickLinks: [QUICK.clover, QUICK.onyx, QUICK.cz, QUICK.pearl, QUICK.hearts, QUICK.bismarck],
    priceChip: 2000,
    editorial: giftEditorial('/categories/bracer.webp', '50% 45%'),
    service: giftService,
  },
};

/** Presentation extras of a category (defaults for categories created in Directus). */
export const getCategoryExtras = (key) => ({ ...DEFAULT_EXTRAS, ...EXTRAS[key] });
