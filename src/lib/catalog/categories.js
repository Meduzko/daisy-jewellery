// Storefront category keys (used in URLs, links, dictionaries) ↔ PostgreSQL `categories.code`.
// Storefront keys are the historic DNTrade-era names and stay unchanged.

export const CATEGORY_KEYS = ['ring', 'earring', 'necklace', 'bracer'];

export const CATEGORY_DB_CODE = {
  ring: 'rings',
  earring: 'earrings',
  necklace: 'necklaces',
  bracer: 'bracelets',
};

export const CATEGORY_KEY_BY_DB_CODE = Object.fromEntries(
  Object.entries(CATEGORY_DB_CODE).map(([key, code]) => [code, key])
);

/** Accepts a storefront key ('ring') or a DB code ('rings'); returns the storefront key or null. */
export function toCategoryKey(value) {
  if (!value) return null;
  if (CATEGORY_DB_CODE[value]) return value;
  return CATEGORY_KEY_BY_DB_CODE[value] || null;
}

export function toCategoryDbCode(value) {
  const key = toCategoryKey(value);
  return key ? CATEGORY_DB_CODE[key] : null;
}
