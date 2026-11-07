const BADGE_TAG_TITLE = 'бейдж';

export const BADGE_TYPES = {
  популярне: 'popular',
  знижка: 'sale',
};

export const BADGE_CLASS = {
  popular: 'badgePopular',
  sale: 'badgeSale',
};

export const BADGE_LABELS = {
  uk: {
    popular: 'Популярне',
    sale: 'Знижка',
  },
  ru: {
    popular: 'Популярное',
    sale: 'Скидка',
  },
};

export function getProductBadges(tags = []) {
  return tags
    .filter((tag) => tag?.title === BADGE_TAG_TITLE)
    .flatMap((tag) => tag.items || [])
    .reduce((badges, badgeItem) => {
      if (!badgeItem?.title || badgeItem.status === 0) {
        return badges;
      }

      const [rawType, rawValue] = String(badgeItem.title).split('/');
      const type = BADGE_TYPES[rawType.trim().toLowerCase()];

      if (!type) {
        return badges;
      }

      badges.push({
        id: badgeItem.id,
        type,
        value: rawValue?.trim() || null,
        color: badgeItem.color || null,
      });

      return badges;
    }, []);
}

export function getBadgeLabel(badge, lang) {
  const labels = BADGE_LABELS[lang] || BADGE_LABELS.uk;

  if (badge.type === 'sale' && badge.value) {
    return `-${badge.value}%`;
  }

  return labels[badge.type];
}

export function parsePrice(price) {
  const numeric = Number(String(price).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

export function getSalePrice(price, badges) {
  const saleBadge = badges.find((badge) => badge.type === 'sale' && badge.value);
  const originalPrice = parsePrice(price);
  const percent = Number(String(saleBadge?.value || '').replace(',', '.'));

  if (!saleBadge || originalPrice == null || !Number.isFinite(percent) || percent <= 0) {
    return null;
  }

  return Math.round(originalPrice * (1 - percent / 100));
}

export function applyProductDiscount(product) {
  if (!product) {
    return product;
  }

  const badges = getProductBadges(product.tags);
  const catalogPrice = product.originalPrice ?? product.price;
  const originalPrice = parsePrice(catalogPrice) ?? catalogPrice;
  // PostgreSQL catalog products carry an explicit sale price (products.sale_price);
  // DNTrade products derive it from the «знижка/N» badge.
  const salePrice = product.catalogSalePrice != null
    ? parsePrice(product.catalogSalePrice)
    : getSalePrice(catalogPrice, badges);

  return {
    ...product,
    originalPrice,
    salePrice,
    price: salePrice ?? originalPrice,
    badges,
  };
}

export function applyProductDiscounts(products = []) {
  return products.map(applyProductDiscount);
}

export function getDisplayPrices(product) {
  const applied = applyProductDiscount(product);
  const hasDiscount =
    applied.salePrice != null && Number(applied.originalPrice) > Number(applied.salePrice);

  return {
    price: applied.price,
    originalPrice: applied.originalPrice,
    salePrice: applied.salePrice,
    hasDiscount,
    badges: applied.badges,
  };
}

export function getLinePrices(item) {
  const { price, originalPrice, hasDiscount } = getDisplayPrices(item);
  const quantity = Number(item?.quantity) || 1;
  const multiply = (value) =>
    quantity > 1 ? parseFloat((Number(value) * quantity).toFixed(2)) : value;

  return {
    price: multiply(price),
    originalPrice: multiply(originalPrice),
    hasDiscount,
  };
}
