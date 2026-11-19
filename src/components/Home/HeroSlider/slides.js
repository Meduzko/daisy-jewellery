// Homepage hero slider — slide order, images and links.
// Copy (uk/ru) lives in ../copy.js → heroSlider.slides[<id>].
//
// To add a slide: add an entry here + its copy under heroSlider.slides; to remove one, delete the entry.
// The first slide is the LCP image and is fetched with high priority; the others load after the page is idle.
//
// type 'promo'    → PromoSlide (image + copy + CTA); layout 'brand' (large «Daisy / Jewellery»), 'statement'
//                   or 'sale' (title + large discount line); theme 'dark' = graphite backdrop, ivory copy;
//                   heading 'h1' marks the slide that carries the page's H1 (exactly one slide should)
// type 'campaign' → the original homepage banner (../Hero/Hero; brings its own H1 — drop `heading: 'h1'` elsewhere)

export const HERO_INTERVAL_MS = 10000;

export const HERO_SLIDES = [
  {
    id: 'collection',
    type: 'promo',
    layout: 'statement',
    heading: 'h1', // «Daisy Jewellery – інтернет-магазин срібних прикрас»
    image: {
      desktop: { src: '/home/hero/collection-desktop.webp', width: 2400, height: 1600, position: '25% 50%' },
      // 2:3 portrait crop: necklace bust, earrings and the cup with the DAISY box
      mobile: { src: '/home/hero/collection-mobile.webp', width: 1080, height: 1620, position: '50% 25%' },
    },
    cta: { href: '#kategorii' },
    secondary: { href: '#novynky' },
  },
  {
    id: 'gift',
    type: 'promo',
    layout: 'brand',
    image: {
      // 3:2 original, 2400×1600
      desktop: { src: '/home/hero/gift-desktop.webp', width: 2400, height: 1600, position: '50% 45%' },
      // 2:3 portrait crop centred on the DAISY box, 1080×1620
      mobile: { src: '/home/hero/gift-mobile.webp', width: 1080, height: 1620, position: '50% 30%' },
    },
    cta: { href: '#kategorii' },
  },
  {
    id: 'blackFriday',
    type: 'promo',
    layout: 'sale',
    theme: 'dark',
    image: {
      // portrait 853×1280 original (the only size supplied) — used at both breakpoints
      desktop: { src: '/home/hero/black-friday.webp', width: 853, height: 1280, position: '50% 56%' },
      mobile: { src: '/home/hero/black-friday.webp', width: 853, height: 1280, position: '50% 40%' },
    },
    cta: { href: '#kategorii' },
  },
];
