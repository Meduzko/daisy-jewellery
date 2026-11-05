// Editorial configuration of the homepage. Products are referenced by CMS code
// and loaded live (title, price, image, link) — edit these lists to re-curate.

// «Прикраси на кожен день» reuses the existing curated «Новинки» list.
export { NEW_PRODUCTS } from '../RingsSlider/config';

// Collection «Клевер в емалі».
// `category` must be one of: ring | earring | necklace | bracer
export const CLOVER_SET = [
  { category: 'earring', code: 2465 },
  { category: 'earring', code: 3097 },
  { category: 'earring', code: 3085 },
  { category: 'earring', code: 3093 },
];

// Instagram grid (6 latest posts, curated manually — there is no Instagram API
// integration). Every tile links to the profile.
export const INSTAGRAM_POSTS = [
  { src: '/home/instagram-1.webp', position: '50% 50%' },
  { src: '/blog/2/blog-post-2-image-2.webp', position: '50% 50%' },
  { src: '/home/instagram-3.webp', position: '50% 50%' },
  { src: '/blog/2/blog-post-2-image-3.webp', position: '50% 50%' },
  { src: '/home/instagram-5.webp', position: '50% 50%' },
  { src: '/categories/ring.webp', position: '50% 50%' },
];
