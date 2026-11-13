# Daisy Jewellery — SEO optimization results

Date: 2026-11-13 · Branch: `worktree-seo-audit` · Audit: [full-site-audit.md](./full-site-audit.md)

Nothing was deployed and no production or local data was modified.

## 1. Completed improvements

### P0 — indexing, canonical, localization, structured data
- **One-hop canonical redirects** (`getCanonicalRedirect` in `src/helpers/seo.js`, used by `src/middleware.js`): tracking params stripped, strict lowercase `/uk|/ru` prefix, other-locale category/product/blog slugs translated. `/ru/kabluchki` → `/ru/koltsa`, `/ru/serezhky/kupyty-…/2465` → `/ru/sergi/kupit-…/2465`, `/UK/kabluchki` → `/uk/kabluchki`, `/ukxyz` → `/uk/ukxyz` (404).
- **Shared alternates builder** `buildAlternates()` → self-canonical, `uk-UA`, `ru-UA`, `x-default`; ru canonicalizes to uk when no real Russian version exists.
- **Blog uk↔ru pairing** fixed in metadata, sitemap and redirects (`LOCALIZED_SEGMENTS`).
- **Layout** keeps only site-wide defaults (no inherited canonical, no fake `application/ld+json` meta, valid favicons, `max-image-preview:large`).
- **Structured data** rewritten (`src/helpers/getJsonLd.js`): `OnlineStore` (one `@id`), `WebSite`, `CollectionPage`+`ItemList`+`BreadcrumbList` on categories, `Product`+`Offer`+`BreadcrumbList` on products, `BlogPosting`+`BreadcrumbList` on posts.
- **ru pages without Russian content**: 26 untranslated products and `oferta` canonicalize to uk and are excluded from the sitemap; about/delivery/returns now have real Russian text.
- **Search** results `noindex, follow`.

### P1 — homepage, categories, products
- New homepage title/description (uk/ru) + accessible H1 suffix.
- New category titles/descriptions/keywords, H1 word order for rings.
- Product meta description: summary + real price + CTA; OG images = product photos.
- Sitemap: real `lastmod`, x-default, correct blog/oferta/product locale coverage.

### P2 — content, links, images
- Blog list heading hierarchy; blog titles with brand; 2 ru blog content fixes.
- Descriptive localized alts on delivery images; category links on About; oferta home link without redirect.
- robots.txt cleanup.

## 2. Before / after (rendered `<head>` on local production build vs. live)

| Page | Before (live) | After (local build) |
|---|---|---|
| `/uk` title | Магазин срібних прикрас - Daisy Jewellery | Срібні прикраси 925 проби — інтернет-магазин Daisy Jewellery |
| `/uk` description | Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі! | Інтернет-магазин срібних прикрас Daisy Jewellery: каблучки, сережки, кольє та браслети зі срібла 925 проби. Безкоштовне подарункове пакування, доставка Новою Поштою по Україні. |
| `/uk` H1 | «Daisy Jewellery» | «Daisy Jewellery — інтернет-магазин срібних прикрас 925 проби» (suffix visually hidden) |
| `/uk/kabluchki` title | Каблучки срібні \| Купити срібні кільця Daisy Jewellery | Срібні каблучки — купити каблучку 925 проби \| Daisy Jewellery |
| `/uk/serezhky` description | Срібні сережки від Daisy Jewellery. Швидка доставка по всій Україні! | Срібні сережки 925 проби: пусети, сережки з фіанітами, оніксом, перламутром, емаллю та позолотою, колекція «Клевер». Безкоштовне подарункове пакування, доставка по Україні. |
| Category schema | `Product` + `AggregateOffer` 500–1400 UAH | `CollectionPage` + `ItemList` (the 16 server-rendered products) + `BreadcrumbList` |
| Product 828 description | …з фіанітами. Купити срібну каблучку від Daisy Jewellery | …з фіанітами. Ціна 1200 грн. Купити срібну каблучку від Daisy Jewellery. |
| Product 828 schema | 1 image, brand string, `http://schema.org/InStock` | 2 images, `Brand`, sku 1364.50, material «Срібло 925°» (catalogue attribute), https availability, seller, breadcrumbs |
| `/ru/koltsa/…/828` (no ru text) | self-canonical, in sitemap | canonical → uk URL, not in sitemap, Ukrainian-only description |
| `/uk/blog/yak-…` hreflang ru | `/ru/blog/yak-…` (404) | `/ru/blog/kak-uznat-razmer-kolca` (200) |
| Inner pages twitter:title | homepage title | none (falls back to the page's `og:title`) |
| 404 page | canonical `/uk` + 3 robots tags | single `noindex`, no canonical |
| `/uk/search?q=…` | index, follow | noindex, follow |
| `/ru/kabluchki`, `/ukxyz` | 200 duplicates | 301 → `/ru/koltsa`, `/uk/ukxyz` (404) |
| sitemap | 500 URLs, 8 broken/wrong blog URLs, `lastmod` = now | 473 URLs (13 static + 8 categories + 236 uk + 210 ru products + 6 blog), 452 with real `lastmod`, x-default on all |

## 3. Files modified

| File | Change |
|---|---|
| `src/middleware.js` | Uses `getCanonicalRedirect` (single 301). |
| `src/helpers/seo.js` | `LOCALIZED_SEGMENTS`, `localizeSegment`, `getCanonicalRedirect`, `buildAlternates`, `absoluteUrl`, OG constants; `source` removed from tracking list (matches previous middleware). |
| `src/helpers/index.js` | Product/category/static metadata builders rewritten on shared helpers; removed 230 lines of duplicated default metadata. |
| `src/helpers/getJsonLd.js` | All schema builders rewritten (see above). |
| `src/app/[lang]/layout.js` | Site-wide metadata only. |
| `src/app/[lang]/page.js` | Homepage metadata + combined JSON-LD. |
| `src/app/[lang]/search/page.js` | noindex, follow. |
| `src/app/[lang]/{about,delivery,returns,oferta}/page.js` | ru content / ru canonical, alts, links. |
| `src/app/[lang]/blog/page.jsx`, `blog/[slug]/page.jsx` | Heading hierarchy, alternates, BlogPosting. |
| `src/app/sitemap.js`, `src/app/robots.js` | See above. |
| `src/components/Category/config.js`, `createCategoryRoute.js` | SEO strings, H1, schema; dead `jsonLd*` fields removed. |
| `src/components/Home/Hero/Hero.js`, `Home/copy.js` | H1 suffix. |
| `src/lib/catalog/repository.js` | `listProductRefs` returns `hasRu`. |
| `src/lib/posts.js` | Post metadata returns date/image. |
| `src/content/ru/podarok-na-8-marta.html`, `podarok-devushke-na-14-fevralya.html` | Title / link fixes. |
| `src/styles/BlogPage.module.css` | Styles keeping the old look for the new heading levels. |
| `test/seo/urls.test.mjs` (new), `test/catalog/repository.test.mjs` | Redirect/alternates tests, `hasRu` assertion. |

## 4. Validation

| Check | Result |
|---|---|
| `npm test` | 59/59 pass (includes 8 new URL/hreflang tests). |
| ESLint on changed files | Clean. (Repo-wide `eslint .` still reports 19 pre-existing `react-hooks` errors in untouched files, e.g. `CartContext.js`.) |
| `next build` | Succeeds; all category/product pages prerender. |
| Redirects (local `next start`) | 9 cases verified, each a single 301. |
| Canonical + hreflang | Verified on home, categories, products (translated and fallback), blog list/posts, info pages, search, checkout, 404. |
| JSON-LD | Parsed from rendered HTML; types per page as listed above. Google Rich Results Test not run (needs a public URL) — run after deploy. |
| Sitemap / robots | Rendered and counted; no ru URL for untranslated products, correct blog pairs. |
| Visual regression | Not automated (no UI test tooling in repo). Visual changes are limited to: rings H1 word order, blog card headings (same computed size via CSS). Check `/uk/blog` and `/uk/kabluchki` on mobile and desktop before deploy. |
| PageSpeed / CWV | Not measured (PSI quota exhausted, no CrUX/GSC access). No performance claims are made. |

## 5. Remaining work

**External / business dependencies**
- Confirm the Корець address and «виробник» vs. «від виробника» wording (see audit §4).
- Google Search Console: submit sitemap, inspect a ru fallback product and a redirected cross-locale URL after deploy.
- Optional `shippingDetails` / `hasMerchantReturnPolicy` in Offer schema once delivery cost below 2 500 UAH and the return policy are formalized (not added: would require inventing rates).

**Database tasks** (via existing import scripts, `db/README.md`)
1. Russian translations for 26 products (list in audit §4).
2. Richer ru descriptions for 113 products.
3. Distinct titles for 9 uk / 5 ru duplicate-title pairs.
Once (1) is imported, those ru pages become self-canonical and return to the sitemap automatically.

**Code (P3)**
- Font loading: Montserrat (latin-only subset) on Cyrillic body text — design decision.
- Next 16 warns that `middleware.js` should be renamed to `proxy.js` (codemod available).
- `getBlogContent` reads `src/content/{lang}/{slug}.html` from the URL slug without validating it against the file list; low risk (only `.html`), worth a whitelist.
- Consider product-specific category OG images.
- Collections («Клевер», «Серця») are filter states; promote to indexable landing pages only if GSC shows demand.

## 6. Measurement plan

| Tool | What to watch | When |
|---|---|---|
| Google Search Console → Pages | «Duplicate, Google chose different canonical» and «Alternate page with proper canonical» for `/ru/*` should drop after the cross-locale 301s; 404s for old `/ru/blog/yak-…` should disappear from the sitemap report. | 2–6 weeks |
| GSC → Sitemaps | 473 submitted; indexed ratio per type (product vs. category). | weekly |
| GSC → Performance | Impressions/CTR for category queries (срібні каблучки, срібні сережки, …) and brand + product queries; compare 28 days before/after deploy; separate uk vs. ru via page filter. | 4 and 8 weeks |
| GSC → Enhancements | Product snippets / Merchant listings, Breadcrumbs: valid items count, errors. | after recrawl |
| Rich Results Test | One product, one category, one blog post, homepage. | right after deploy |
| PageSpeed Insights | `/uk`, `/uk/kabluchki`, one product, mobile + desktop; record LCP/INP/CLS as baseline. | after deploy, then monthly |
| GA4 (G-CGM54TDF2N) | Organic sessions, organic purchase conversions and revenue (LiqPay `Purchase`), landing-page report for categories/products. | monthly |
