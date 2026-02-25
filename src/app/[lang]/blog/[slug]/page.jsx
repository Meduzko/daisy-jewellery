import fs from 'fs';
import path from 'path';
import { getHtmlPostMetadata, getBlogContent } from '../../../../lib/posts';
import { notFound } from 'next/navigation';

const siteUrl = process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL || 'https://daisy-jewellery.com.ua';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  if (params?.slug) {
    const metadata = getHtmlPostMetadata(params.slug, lang);
    if (metadata) {
      return {
        title: metadata.title,
        description: metadata.description,
        alternates: {
          canonical: `${siteUrl}/${lang}/blog/${params.slug}`,
          languages: {
            'uk-UA': `${siteUrl}/uk/blog/${params.slug}`,
            'ru-UA': `${siteUrl}/ru/blog/${params.slug}`,
          },
        },
        openGraph: {
          title: metadata.title,
          description: metadata.description,
          url: `${siteUrl}/${lang}/blog/${params.slug}`,
          type: 'article',
        },
        robots: {
          index: true,
          follow: true,
        },
      };
    }
  }

  return {
    title: 'Blog | Daisy Jewellery',
    description: 'Jewellery blog',
    robots: {
      index: false,
      follow: true,
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

export default async function BlogPostPage({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const content = await getBlogContent(lang, params.slug);
  if (!content) notFound();

  return (
    <div dangerouslySetInnerHTML={{ __html: content }} />
  );
}


