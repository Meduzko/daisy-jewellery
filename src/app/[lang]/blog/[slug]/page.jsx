import fs from 'fs';
import path from 'path';
import { getHtmlPostMetadata, getBlogContent } from '../../../../lib/posts';
import { notFound } from 'next/navigation';
import { buildAlternates, localizeSegment, SITE_NAME, OG_LOCALE } from '../../../../helpers/seo';
import { getBlogPostingJsonLd, getLogoJsonLd } from '../../../../helpers/getJsonLd';

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
  const metadata = params?.slug ? getHtmlPostMetadata(params.slug, lang) : null;
  if (!metadata) return { title: `Blog | ${SITE_NAME}`, robots: { index: false, follow: true } };

  const alternates = buildAlternates(lang, getPostPaths(params.slug));
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

  return slugsByLang.flat();
}

export default async function BlogPostPage(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const content = await getBlogContent(lang, params.slug);
  if (!content) notFound();
  const metadata = getHtmlPostMetadata(params.slug, lang);
  const jsonLd = [
    getLogoJsonLd(),
    ...getBlogPostingJsonLd({
      title: metadata.title,
      description: metadata.description,
      date: metadata.date,
      image: metadata.image,
      path: `${lang}/blog/${params.slug}`,
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
