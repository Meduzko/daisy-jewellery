import fs from 'fs';
import path from 'path';
import { getHtmlPostMetadata, getBlogContent } from '../../../../lib/posts';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  // Handle dynamic slug routes
  if (params?.slug) {
    const metadata = getHtmlPostMetadata(params.slug, 'ru');
    if (metadata) {
      return {
        title: metadata.title,
        description: metadata.description,
        alternates: {
          canonical:`${process.env.SITE_DOMAIN}/ru/blog/${params.slug}`
        },
        openGraph: {
          title: metadata.title,
          description: metadata.description,
          url: `https://daisy-jewelry-store.com/ru/blog/${params.slug}`,
        },
      };
    }
  }

  // Default metadata for `/blog`
  return {
    title: 'Блог | Daisy Jewellery',
    description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
    alternates: {
      canonical:`${process.env.SITE_DOMAIN}/ru/blog`
    },
    openGraph: {
      title: 'Блог | Daisy Jewellery',
      description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
      url: 'https://daisy-jewellery.com.ua/blog',
    },
  };
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), 'src', 'content', 'ru');
  const files = fs.readdirSync(contentDir);

  const slugs = files.map((file) => path.parse(file).name);

  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }) {
  const content = await getBlogContent('ru', params.slug);

  if (!content) {
    notFound();
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
