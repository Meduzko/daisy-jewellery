import { resolveProductCategory } from './resolveProductCategory';

export const getProductLink = (product, lang) => {
  const { code } = product;
  const category = product.category || resolveProductCategory(product);
  const locale = lang === 'ru' ? 'ru' : 'uk';
  const categoryMap = {
    uk: {
      ring: 'kabluchki/kupyty-sribnu-kabluchku',
      earring: 'serezhky/kupyty-serezhky-sribni',
      necklace: 'kolye/kupyty-sribne-kolye',
      bracer: 'braslety/kupyty-sribnyy-braslet',
    },
    ru: {
      ring: 'koltsa/kupit-serebryanoye-koltso',
      earring: 'sergi/kupit-serebryanyye-sergi',
      necklace: 'kolye/kupit-serebryanoye-kolye',
      bracer: 'braslety/kupit-serebryanyy-braslet',
    }
  };
  const cat = categoryMap[locale][category];

  if (!cat || code == null) {
    return `/${locale}`;
  }

  return `/${locale}/${cat}/${code}`;
};
