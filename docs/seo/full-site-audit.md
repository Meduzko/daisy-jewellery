# Daisy Jewellery — full-site SEO audit

Date: 2026-11-13 · Scope: every route in `src/app` (uk + ru), live site https://daisy-jewellery.com.ua and the repository (branch `worktree-seo-audit`, base `ecda67c`).

## 1. Method and sources

| Source | What was checked |
|---|---|
| Repository | All routes under `src/app/[lang]`, `sitemap.js`, `robots.js`, `middleware.js`, metadata helpers (`src/helpers/index.js`, `seo.js`), JSON-LD (`getJsonLd.js`), category config, homepage copy, product page components, blog HTML (`src/content`). |
| Live site (curl) | Status codes / redirects of 30+ URLs, rendered `<head>` of home, categories, products, blog, sitemap (500 URLs) and robots.txt. |
| Local PostgreSQL (`daisy_dev`, read-only queries) | Product data quality: counts, descriptions, translations, duplicates, images, prices, stock. |
| Local production build (`next build` + `next start`) | Rendered metadata, hreflang, JSON-LD, redirects, sitemap after the changes. |

**Live vs. repository:** the live site already runs the redesign that is in the repository (identical titles, H1s, schema output, sitemap structure). No functional difference was found; the repository is the implementation target.

**Not available:** Google Search Console, GA4 data, keyword-volume tools, PageSpeed Insights (the keyless API quota was exhausted on 2026-11-13). Keyword choices below are therefore *recommendations* derived from the catalogue, URLs and on-site language, not verified demand.

## 2. Route inventory

| Type | uk | ru | Rendering |
|---|---|---|---|
| Home | `/uk` | `/ru` | ISR 900 s |
| Categories (4) | `/uk/{kabluchki,serezhky,kolye,braslety}` | `/ru/{koltsa,sergi,kolye,braslety}` | ISR, one URL per category, «Показати ще» loads more via API |
| Products (236 active) | `/uk/{cat}/{kupyty-…}/{code}` | `/ru/{cat}/{kupit-…}/{code}` | ISR + `generateStaticParams` |
| Blog | `/uk/blog`, 3 posts | `/ru/blog`, 3 posts (different slugs) | static |
| Info | about, contact, delivery, returns, oferta | same paths | dynamic |
| Utility | `/search`, `/order`, 404 | same | dynamic |
| Machine | `/sitemap.xml`, `/robots.txt` | — | |

Filter/sort/quick-link states are query parameters on the category URL (`?q=клевер`, `?sort=…`) and canonicalize to the clean category URL. There is no pagination (old `/uk/kabluchki/2` 301s to `/uk/kabluchki`). Collections («Клевер», «Серця», …) are filtered views, not separate landing pages.

## 3. Verified issues

Severity: **P0** critical indexing/canonical/localization/schema · **P1** key page SEO · **P2** content/linking/images · **P3** long-term.

| # | Sev | Issue | Affected routes | Evidence | Solution |
|---|---|---|---|---|---|
| 1 | P0 | Cross-locale slug duplicates return 200 | `/ru/kabluchki`, `/uk/koltsa`, `/ru/serezhky`, `/uk/sergi`, `/ru/kabluchki/kupyty-…/{code}`, `/ru/serezhky/kupyty-…/{code}`, etc. | live: all `200`; `/ru/serezhky` rendered Ukrainian content | Middleware 301 to the locale's own slug (single hop). |
| 2 | P0 | Any path starting with `/uk` or `/ru` is treated as localized | `/ukxyz` → 200 duplicate of the homepage; `/UK/kabluchki` → 301 → `/uk/UK/kabluchki` → 404 | live curl | Strict `^/(uk\|ru)(/\|$)` match, lowercase normalization. |
| 3 | P0 | Blog hreflang/sitemap pair uk and ru posts by the *same* slug, but slugs differ per locale | 6 blog URLs | sitemap listed `/ru/blog/yak-vyznachyty-rozmir-kabluchky` → **404**; post hreflang pointed to the same 404s; real ru posts were not in the sitemap | uk↔ru slug map (`LOCALIZED_SEGMENTS`) used by metadata, sitemap and middleware. |
| 4 | P0 | Root layout put JSON-LD in a `<meta name="application/ld+json">` tag | every page | live `<head>` | Removed; schema is emitted as real `<script type="application/ld+json">`. |
| 5 | P0 | Layout set `canonical=/uk` + hreflang for the homepage, inherited by pages without own alternates | 404 pages, checkout, any future page | live 404 had `canonical=/uk` plus 3 robots tags | Canonical/hreflang moved to page level; layout holds only site defaults. |
| 6 | P0 | Category pages marked up as a fake `Product` with `AggregateOffer` and a hardcoded image/price range | 8 category URLs | ranges 500–1400 (rings) vs. real 550–2800 UAH in DB; Google's product snippet guidelines exclude category pages | `CollectionPage` + `ItemList` (server-rendered products) + `BreadcrumbList`. |
| 7 | P0 | Internal search results indexable | `/uk/search?q=…` | `robots: index, follow`, canonical `/uk/search` | `noindex, follow`. |
| 8 | P0 | ru product pages for 26 products without a Russian translation show Ukrainian text, self-canonical + listed in sitemap | 26 `/ru/…` product URLs | DB: 26 active products with no `ru` row in `product_translations` | ru URL canonicalizes to uk, not offered as ru alternate, removed from sitemap; meta description kept fully Ukrainian. |
| 9 | P0 | Info pages serve Ukrainian body on `/ru` with Russian metadata | `/ru/about`, `/ru/delivery`, `/ru/returns`, `/ru/oferta` | source | about/delivery/returns translated (faithful translations of the existing text); oferta (legal contract) marked Ukrainian-only: ru canonical → uk, `lang="uk"` on content, excluded from sitemap. |
| 10 | P1 | No `x-default` hreflang anywhere | all pages | live head | Added (`x-default` = uk). |
| 11 | P1 | Twitter tags on every inner page carried the *homepage* title/description; RU twitter image resolved to `/ru/logo_black.png` (404) | all inner pages, all ru pages | live head; `curl /ru/logo_black.png` → 404 | Layout keeps only `twitter:card`; X falls back to each page's `og:*`. `metadataBase` = site root. |
| 12 | P1 | No `og:image` on category/product/info pages (only the logo on home) | all | live head | Products: real product photos; others: brand campaign image `/banner.webp` (1870×1403). |
| 13 | P1 | Homepage title/description generic («Вишуканість у кожній деталі!»), H1 is only the brand | `/uk`, `/ru` | live head | New title/description with primary keyword + verified facts; accessible H1 suffix (visually hidden, no design change). |
| 14 | P1 | Category descriptions thin/duplicative («Швидка доставка по всій Україні!»), unverifiable claims («за найкращою ціною від виробника») | 8 category URLs | config | Rewritten from real assortment (motif counts from DB) and verified services. |
| 15 | P1 | Product meta descriptions could run ≈200+ chars and had no price | 472 product URLs | rendered | ≤110-char summary + real price + category CTA. `seo_description` from DB still wins when set. |
| 16 | P1 | Product schema: single image, brand as plain string, `http://schema.org/InStock`, no breadcrumbs, Offer emitted even without a price | 472 product URLs | live JSON-LD | Product (all images, `Brand`, sku/productID, catalogue material) + Offer only with real price, https availability, seller ref + `BreadcrumbList`. |
| 17 | P1 | Organization data split across `Organization` (×2, different URLs) and `LocalBusiness` with invalid fields (`priceRange:"UAH"`, telephone inside address, country "Ukraine") | home + every page | live JSON-LD | One `OnlineStore` with stable `@id`, logo, real social profiles, same address/contacts. |
| 18 | P1 | `WebSite` SearchAction targeted `/search?query=` (non-localized, 301); Google retired the sitelinks search box in 2024 | home | live | Removed SearchAction; `WebSite` with `inLanguage` + publisher. |
| 19 | P1 | Sitemap `lastmod` = generation time for all 500 URLs | sitemap | live: 3 distinct timestamps | Products: `products.updated_at`; blog: post date; static pages: omitted. |
| 20 | P2 | robots.txt `Disallow: /order` never matched (`/uk/order`); `Host` is non-standard | robots | live | Removed (checkout stays crawlable so its `noindex` is seen); Host dropped. |
| 21 | P2 | Layout referenced `/favicon-16x16.png`, `/favicon-32x32.png` that do not exist | every page | `public/` listing | Use existing `favicon.ico`, `favicon.svg`, `favicon-96x96.png`. |
| 22 | P2 | Blog list: one `<h1>` per post card, «Читати повністю» as `<h3>` | `/uk/blog`, `/ru/blog` | source | Single page H1, cards `<h2>` (same look via CSS), link label as text. |
| 23 | P2 | Blog post titles had no brand; no `BlogPosting` schema | 6 posts | live head | `… | Daisy Jewellery`, `BlogPosting` (date from post) + breadcrumbs, OG image = first article image. |
| 24 | P2 | ru 8-March post title repeats a phrase («…очаровать женщину: как очаровать женщину»); ru 14-Feb post links to the uk homepage | 2 ru posts | content files | Fixed. |
| 25 | P2 | Delivery images alt «Delivery image 1/2» (English, non-descriptive) | `/uk/delivery`, `/ru/delivery` | source | Descriptive localized alts (written after viewing the photos). |
| 26 | P2 | About page lists categories without links | `/uk/about`, `/ru/about` | source | Descriptive internal links to the 4 categories. |
| 27 | P2 | Oferta link `<a href='/'>` → extra redirect hop, lint error | `/*/oferta` | eslint | `<Link href="/uk">`. |
| 28 | P2 | Category H1 «Каблучки срібні» / «Кольца серебряные» inverted vs. the other categories and search phrasing | rings | config | «Срібні каблучки» / «Серебряные кольца». |

### Checked and found correct (no change)

- `<html lang>` follows the locale; header/footer/menu and UI strings are localized.
- Product URLs for unknown codes and codes from another category return **404** (`noindex`).
- Facet/sort/quick-link query URLs keep the clean category canonical; tracking parameters 301 to the clean URL.
- Old numbered listing URLs 301 to the category (`next.config.mjs`).
- Product H1 = product title; gallery images have descriptive alts; LCP images use `priority` (hero, first product image, first category cards); fonts use `next/font` with `display: swap`.
- All 6 product links inside blog posts resolve to active products (200).
- All active products have images and a price; no product is fully out of stock (stock is mostly untracked).

## 4. Database / content findings (not code)

| Finding | Count | Detail | Recommended handling |
|---|---|---|---|
| Active products without a Russian translation | 26 | e.g. codes 9792, 7723, 828, 17392, 14424, 10327 … (`SELECT … WHERE NOT EXISTS ru row`) | Add ru rows (`db:import:ru`). Code already canonicalizes them to uk until then. |
| Very short ru descriptions (<80 chars) | 113 of 210 | uk: 1 of 236 | Owner-supplied ru texts via the existing import. |
| Duplicate product titles | uk 9 pairs, ru 5 pairs | e.g. «Срібні пусети «Клевер» з фіанітами» = codes 7993 & 6865 (different article, weight, price) | Owner to add the real distinguishing attribute (size, design) to `product_translations.title`. Not auto-generated to avoid inventing differences. |
| `seo_title` / `seo_description` unused | 0 of 446 | fields exist and override generated text | Optional; fill only for products with GSC data showing weak CTR. |
| Business claim consistency | — | Homepage says «український виробник» (maker); categories say «від українського виробника» (sourced from a maker) | Owner to confirm which is true; adjust copy once. |
| Physical address in schema | — | `вулиця Київська 3/3, Корець, 34700` taken from the existing LocalBusiness markup | Owner to confirm it is current; type kept as `OnlineStore` (no walk-in claim). |

No migration was required: no data was changed. The only DB-layer code change is a read-only `hasRu` flag in `listProductRefs`.

## 5. Keyword mapping (recommendations — no volume data available)

| Page | Primary keyword | Secondary keywords | Intent | Status |
|---|---|---|---|---|
| `/uk` | срібні прикраси | інтернет-магазин срібних прикрас, прикраси зі срібла 925, Daisy Jewellery | commercial / navigational | Optimized |
| `/ru` | серебряные украшения | интернет-магазин серебряных украшений, украшения из серебра 925 | commercial | Optimized |
| `/uk/kabluchki` | срібні каблучки | купити срібну каблучку, каблучка срібло 925, срібні кільця, каблучки з фіанітами | transactional | Optimized |
| `/ru/koltsa` | серебряные кольца | купить серебряное кольцо, кольцо серебро 925 | transactional | Optimized |
| `/uk/serezhky` | срібні сережки | срібні пусети, сережки 925 проби, сережки «Клевер» | transactional | Optimized |
| `/ru/sergi` | серебряные серьги | серебряные пусеты, серьги 925 пробы | transactional | Optimized |
| `/uk/kolye` | срібне кольє | срібне кольє з підвіскою, кольє 925 проби | transactional | Optimized |
| `/ru/kolye` | серебряное колье | колье с подвеской, колье 925 пробы | transactional | Optimized |
| `/uk/braslety` | срібні браслети | срібний браслет жіночий, браслет бісмарк | transactional | Optimized |
| `/ru/braslety` | серебряные браслеты | серебряный браслет женский, браслет бисмарк | transactional | Optimized |
| Product pages | product title (type + motif + stone/plating) | «купити» + category, «925 проби», price | transactional | Template optimized; duplicate titles need DB fix |
| `/uk/blog/yak-vyznachyty-rozmir-kabluchky` | як визначити розмір каблучки | розмір каблучки, таблиця розмірів каблучок | informational | Metadata + schema; content unchanged |
| `/uk/blog/podarunok-divchyni-na-14-lyutoho` | подарунок дівчині на 14 лютого | що подарувати коханій | informational / seasonal | Metadata + schema |
| `/uk/blog/podarunok-na-8-bereznya` | подарунок на 8 березня | що подарувати жінці на 8 березня | informational / seasonal | Metadata + schema; ru title fixed |
| `/uk/delivery`, `/uk/returns` | доставка та оплата / повернення та обмін (brand-qualified) | — | navigational / support | ru content translated |

Cannibalization: homepage targets the generic «срібні прикраси»; each category owns its jewellery type; collections stay as filtered states (canonical → category), so no two indexable URLs target the same query. Blog posts target informational queries and link to products/categories.

## 6. Core Web Vitals (static review only)

No field or lab measurement was possible (no GSC/CrUX access; PSI API quota exhausted). Observations from code:

- Hero (`/banner.webp`, `priority`, `quality=85`), product gallery first image and first category cards use `priority` → LCP candidates are preloaded.
- Three font families are loaded; **Montserrat is loaded with the `latin` subset only** while the body text is Cyrillic, so it falls back for most glyphs. Possible saving, but it changes rendering → left for a design decision (P3).
- MUI + Emotion run on every page (layout providers); the category/product UIs are partly client components. Bundle analysis not run (no analyzer installed; not added to avoid new packages).
