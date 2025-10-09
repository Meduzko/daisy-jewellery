import fs from 'fs';
import path from 'path';
import { getHtmlPostMetadata, getBlogContent } from '../../../../lib/posts';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  if (params?.slug) {
    const metadata = getHtmlPostMetadata(params.slug, lang);
    if (metadata) {
      return {
        title: metadata.title,
        description: metadata.description,
        alternates: {
          canonical:`${process.env.SITE_DOMAIN}/${lang}/blog/${params.slug}`
        },
        openGraph: {
          title: metadata.title,
          description: metadata.description,
          url: `https://daisy-jewellery.com.ua/${lang}/blog/${params.slug}`,
        },
      };
    }
  }

  return {
    title: 'Blog | Daisy Jewellery',
    description: 'Jewellery blog',
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


