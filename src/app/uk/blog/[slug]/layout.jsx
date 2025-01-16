import { getHtmlPostMetadata } from '../../../../lib/posts';

export async function generateMetadata({ params }) {
  // Handle dynamic slug routes
  if (params?.slug) {
    const metadata = getHtmlPostMetadata(params.slug);
    if (metadata) {
      return {
        title: metadata.title,
        description: metadata.description,
        openGraph: {
          title: metadata.title,
          description: metadata.description,
          url: `https://daisy-jewelry-store.com/blog/${params.slug}`,
        },
      };
    }
  }

  // Default metadata for `/blog`
  return {
    title: 'Блог | Daisy Jewellery',
    description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
    openGraph: {
      title: 'Блог | Daisy Jewellery',
      description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
      url: 'https://daisy-jewellery.com.ua/blog',
    },
  };
}

export default function BlogLayout({ children }) {
  return (
    <div>
      <main>{children}</main>
    </div>
  );
}
