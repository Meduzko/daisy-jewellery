const CATEGORY_KEYS = ['ring', 'earring', 'necklace', 'bracer'];

export const resolveProductCategory = (product) => {
  if (product?.category && CATEGORY_KEYS.includes(product.category)) {
    return product.category;
  }

  const text = [product?.title, product?.short_description]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (/браслет/.test(text)) return 'bracer';
  if (/сереж|серьг|пусет/.test(text)) return 'earring';
  if (/кольє|колье|підвіск|подвеск|ланцюж|цепоч/.test(text)) return 'necklace';
  if (/каблуч|кільц|кольц/.test(text)) return 'ring';

  return '';
};
