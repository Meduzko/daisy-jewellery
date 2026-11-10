// UI strings of the category page (uk / ru).

const plural = (n, [one, few, many]) => {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
};

export const formatPrice = (value) => {
  const number = Number(value);
  if (!Number.isFinite(number)) return String(value ?? '');
  // 1800 → «1 800» (no-break space keeps the price on one line)
  return String(Math.round(number)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const COPY = {
  uk: {
    home: 'Головна',
    breadcrumb: 'Навігаційний ланцюжок',
    silver: 'Срібло 925°',
    items: (n) => `${n} ${plural(n, ['прикраса', 'прикраси', 'прикрас'])}`,
    collections: (name) => `Добірки: ${name.toLowerCase()}`,
    toolbar: 'Сортування та фільтри',
    sort: 'Сортувати',
    filters: 'Фільтри',
    sortOptions: {
      default: 'Рекомендовані',
      newest: 'Новинки',
      price_asc: 'Ціна: від низької',
      price_desc: 'Ціна: від високої',
    },
    upTo: (n) => `До ${formatPrice(n)} грн`,
    from: (n) => `Від ${formatPrice(n)} грн`,
    currency: 'грн',
    closeFilters: 'Закрити фільтри',
    removeFilter: (label) => `Прибрати фільтр ${label}`,
    clearAll: 'Очистити все',
    clear: 'Очистити',
    show: (n) => `Показати ${n} ${plural(n, ['прикрасу', 'прикраси', 'прикрас'])}`,
    showNone: 'Нічого не знайдено',
    collection: 'Добірка',
    category: 'Категорія',
    allCategories: 'Усі прикраси',
    size: 'Розмір',
    sizeChip: (s) => `Розмір ${s}`,
    howToMeasure: 'Як визначити',
    price: 'Ціна',
    priceMin: 'Мінімальна ціна',
    priceMax: 'Максимальна ціна',
    collectionNames: { new: 'Новинки', popular: 'Хіт продажів' },
    badges: { new: 'Новинка', popular: 'Хіт продажів' },
    seen: (shown, total) => `Ви переглянули ${shown} з ${total} ${plural(total, ['прикраси', 'прикрас', 'прикрас'])}`,
    loadMore: 'Показати ще',
    loading: 'Завантаження…',
    empty: 'За цими фільтрами прикрас не знайдено.',
    resetFilters: 'Скинути фільтри',
    error: 'Не вдалося завантажити прикраси. Спробуйте ще раз.',
    quickAdd: (name) => `Додати «${name}» до кошика`,
    quickSize: (name) => `Розмір для «${name}»`,
    readMore: 'Читати більше',
    readLess: 'Згорнути',
    results: (n) => `Знайдено ${n}`,
    search: 'Пошук',
    searchResults: 'Результати пошуку',
    searchShort: 'Введіть щонайменше 2 символи для пошуку.',
    searchEmpty: 'За вашим запитом нічого не знайдено. Перегляньте наші категорії:',
  },
  ru: {
    home: 'Главная',
    breadcrumb: 'Навигационная цепочка',
    silver: 'Серебро 925°',
    items: (n) => `${n} ${plural(n, ['украшение', 'украшения', 'украшений'])}`,
    collections: (name) => `Подборки: ${name.toLowerCase()}`,
    toolbar: 'Сортировка и фильтры',
    sort: 'Сортировать',
    filters: 'Фильтры',
    sortOptions: {
      default: 'Рекомендуемые',
      newest: 'Новинки',
      price_asc: 'Цена: по возрастанию',
      price_desc: 'Цена: по убыванию',
    },
    upTo: (n) => `До ${formatPrice(n)} грн`,
    from: (n) => `От ${formatPrice(n)} грн`,
    currency: 'грн',
    closeFilters: 'Закрыть фильтры',
    removeFilter: (label) => `Убрать фильтр ${label}`,
    clearAll: 'Очистить все',
    clear: 'Очистить',
    show: (n) => `Показать ${n} ${plural(n, ['украшение', 'украшения', 'украшений'])}`,
    showNone: 'Ничего не найдено',
    collection: 'Подборка',
    category: 'Категория',
    allCategories: 'Все украшения',
    size: 'Размер',
    sizeChip: (s) => `Размер ${s}`,
    howToMeasure: 'Как определить',
    price: 'Цена',
    priceMin: 'Минимальная цена',
    priceMax: 'Максимальная цена',
    collectionNames: { new: 'Новинки', popular: 'Хит продаж' },
    badges: { new: 'Новинка', popular: 'Хит продаж' },
    seen: (shown, total) => `Вы просмотрели ${shown} из ${total} ${plural(total, ['украшения', 'украшений', 'украшений'])}`,
    loadMore: 'Показать ещё',
    loading: 'Загрузка…',
    empty: 'По этим фильтрам украшений не найдено.',
    resetFilters: 'Сбросить фильтры',
    error: 'Не удалось загрузить украшения. Попробуйте ещё раз.',
    quickAdd: (name) => `Добавить «${name}» в корзину`,
    quickSize: (name) => `Размер для «${name}»`,
    readMore: 'Читать больше',
    readLess: 'Свернуть',
    results: (n) => `Найдено ${n}`,
    search: 'Поиск',
    searchResults: 'Результаты поиска',
    searchShort: 'Введите хотя бы 2 символа для поиска.',
    searchEmpty: 'По вашему запросу ничего не найдено. Посмотрите наши категории:',
  },
};

export const getCategoryCopy = (lang) => (lang === 'ru' ? COPY.ru : COPY.uk);
