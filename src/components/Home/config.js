// Editorial configuration of the homepage. Products are referenced by CMS code
// and loaded live (title, price, image, link) — edit these lists to re-curate.

// Collection «Клевер в емалі».
// `category` must be one of: ring | earring | necklace | bracer
export const CLOVER_SET = [
  { category: 'earring', code: 4723 },
  { category: 'necklace', code: 4737 },
  { category: 'bracer', code: 4736 },
  { category: 'ring', code: 4730 },
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
