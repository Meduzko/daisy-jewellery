import fs from 'fs';
import path from 'path';
import { getHtmlPostMetadata, getBlogContent } from '../../../../lib/posts';
import { notFound } from 'next/navigation';

export async function generateMetadata({ params }) {
  // Handle dynamic slug routes
  if (params?.slug) {
    const metadata = getHtmlPostMetadata(params.slug);
    if (metadata) {
      return {
        title: metadata.title,
        description: metadata.description,
        alternates: {
          canonical:`${process.env.SITE_DOMAIN}/uk/blog/${params.slug}`
        },
        openGraph: {
          title: metadata.title,
          description: metadata.description,
          url: `https://daisy-jewelry-store.com/uk/blog/${params.slug}`,
        },
      };
    }
  }

  // Default metadata for `/blog`
  return {
    title: 'Блог | Daisy Jewellery',
    description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
    alternates: {
      canonical:`${process.env.SITE_DOMAIN}/uk/blog`
    },
    openGraph: {
      title: 'Блог | Daisy Jewellery',
      description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
      url: 'https://daisy-jewellery.com.ua/uk/blog',
    },
  };
}

export async function generateStaticParams() {
  const contentDir = path.join(process.cwd(), 'src', 'content', 'uk');
  const files = fs.readdirSync(contentDir);

  const slugs = files.map((file) => path.parse(file).name);

  return slugs.map((slug) => ({ slug }));
}

export default async function BlogPostPage({ params }) {
  const content = await getBlogContent('uk', params.slug);

  if (!content) {
    notFound();
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
