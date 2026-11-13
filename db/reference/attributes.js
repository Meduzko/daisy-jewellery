// Product attribute definitions (filters / product specifications).
// Shared by migration 2 (seed), the importers and the 2026-11-12 patch.
// Changing this list does NOT change databases that are already migrated — the
// importers fill missing rows (fill-only), and schema changes need a patch/migration.
//
// code            uk / ru name                     source column (owner's spec sheets, 2026-11-12)
// insertion       Вставка                          «Вставка» (+ DNTrade #вставка)
// insertion_color Колір вставки                    «Колір вставки»
// metal           Метал                            «Матеріал»
// coating         Покриття                         «Покриття»
// color           Колір                            — (reserved, metal colour)
// manufacturer    Виробник                         DNTrade #виробник
// clasp           Тип застібки                     «Тип защібки» (earrings)
const ATTRIBUTES = [
  { code: 'insertion', sort: 1, uk: 'Вставка', ru: 'Вставка' },
  { code: 'metal', sort: 2, uk: 'Метал', ru: 'Металл' },
  { code: 'coating', sort: 3, uk: 'Покриття', ru: 'Покрытие' },
  { code: 'color', sort: 4, uk: 'Колір', ru: 'Цвет' },
  { code: 'manufacturer', sort: 5, uk: 'Виробник', ru: 'Производитель' },
  { code: 'insertion_color', sort: 6, uk: 'Колір вставки', ru: 'Цвет вставки' },
  { code: 'clasp', sort: 7, uk: 'Тип застібки', ru: 'Тип застёжки' },
];

module.exports = { ATTRIBUTES };
