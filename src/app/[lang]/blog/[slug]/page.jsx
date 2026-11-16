import fs from 'fs';
import path from 'path';
import { getHtmlPostMetadata, getBlogContent } from '../../../../lib/posts';
import { notFound } from 'next/navigation';
import { buildAlternates, localizeSegment, SITE_NAME, OG_LOCALE } from '../../../../helpers/seo';
import { getBlogPostingJsonLd, getLogoJsonLd } from '../../../../helpers/getJsonLd';
import { getDbPost, getDbPosts } from '../../../../lib/blog';
import { encode as escapeHtml } from 'html-entities';

export const revalidate = 900; // CMS posts; purged on publish by /api/catalog/revalidate

/** uk/ru paths of a post; ru only when the translated post exists. */
function getPostPaths(slug) {
  const ukSlug = localizeSegment(slug, 'uk');
  const ruSlug = localizeSegment(slug, 'ru');
  return {
    uk: `uk/blog/${ukSlug}`,
    ru: getHtmlPostMetadata(ruSlug, 'ru') ? `ru/blog/${ruSlug}` : null,
  };
}

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const staticMeta = params?.slug ? getHtmlPostMetadata(params.slug, lang) : null;
  const cmsPost = staticMeta || !params?.slug ? null : await getDbPost(params.slug, lang);
  const metadata = staticMeta || (cmsPost && { ...cmsPost, title: cmsPost.seoTitle });
  if (!metadata) return { title: `Blog | ${SITE_NAME}`, robots: { index: false, follow: true } };

  const alternates = buildAlternates(lang, cmsPost ? cmsPost.paths : getPostPaths(params.slug));
  const title = `${metadata.title} | ${SITE_NAME}`;
  return {
    title,
    description: metadata.description,
    alternates,
    openGraph: {
      title,
      description: metadata.description,
      url: alternates.canonical,
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      type: 'article',
      publishedTime: metadata.datePublished,
      ...(metadata.image ? { images: [{ url: metadata.image, alt: metadata.title }] } : {}),
    },
  };
}

export async function generateStaticParams() {
  const langs = ['uk', 'ru'];
  const slugsByLang = langs.map((lang) => {
    const contentDir = path.join(process.cwd(), 'src', 'content', lang);
    if (!fs.existsSync(contentDir)) return [];
    const files = fs.readdirSync(contentDir);
    const slugs = files.map((file) => path.parse(file).name);
    return slugs.map((slug) => ({ lang, slug }));
  });

  const cms = (await Promise.all(langs.map(getDbPosts))).flat().map((p) => ({ lang: p.lang, slug: p.slug }));
  return [...slugsByLang.flat(), ...cms];
}

export default async function BlogPostPage(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const staticContent = await getBlogContent(lang, params.slug);
  const cmsPost = staticContent ? null : await getDbPost(params.slug, lang);
  if (!staticContent && !cmsPost) notFound();
  const metadata = cmsPost || getHtmlPostMetadata(params.slug, lang);
  // CMS posts use the static posts' markup classes, so they share the blog styles.
  const content = staticContent || `<main class="blog-container"><h1 class="blog-h1">${escapeHtml(cmsPost.title)}</h1>${
    cmsPost.image ? `<img src="${escapeHtml(cmsPost.image)}" alt="${escapeHtml(cmsPost.title)}" class="blog-image-inside" />` : ''
  }${cmsPost.content}</main>`;
  const jsonLd = [
    getLogoJsonLd(),
    ...getBlogPostingJsonLd({
      title: metadata.title,
      description: metadata.description,
      date: metadata.date,
      image: metadata.image,
      path: cmsPost ? cmsPost.paths[lang] : `${lang}/blog/${params.slug}`,
      lang,
    }),
  ];

  return (
    <>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
