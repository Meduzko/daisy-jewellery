import 'server-only';
 
const dictionaries = {
  uk: () => import('./dictionaries/uk.json').then((module) => module.default),
  ru: () => import('./dictionaries/ru.json').then((module) => module.default),
}
 
export const getTranslations = async (locale) => dictionaries[locale]();

export const getCategoryTranslations = async ({ lang, categoryName }) => {
  const translations = await getTranslations(lang);
  const tk = translations.products[categoryName];

  return tk;
};

export const getItemTranslations = async ({ lang, categoryName, code }) => {
  if (!lang) {
    return;
  }

  const tk = await getCategoryTranslations({ lang, categoryName });
  const res = tk?.[code];

  return res;
};

export const getTranslation = async ({ lang, key }) => {
  const translations = await getTranslations(lang);

  return translations[key];
};
