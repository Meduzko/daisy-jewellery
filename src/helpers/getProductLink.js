export const getProductLink = product => {
  const { category, code } = product;
  const categoryMap = {
    ring: 'kabluchki/kupyty-sribnu-kabluchku',
    earring: 'serezhky/kupyty-serezhky-sribni',
    necklace: 'kolye/kupyty-sribne-kolye',
    bracer: 'braslety/kupyty-sribnyy-braslet',
  }
  const cat = categoryMap[category];
  const productLink = `/${cat}/${code}`;

  return productLink;
}
