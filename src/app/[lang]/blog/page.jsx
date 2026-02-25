import Link from 'next/link';
import { getAllHtmlPosts } from '../../../lib/posts';
import styles from '../../../styles/BlogPage.module.css';

const siteUrl = process.env.SITE_DOMAIN || process.env.NEXT_PUBLIC_BASE_URL || 'https://daisy-jewellery.com.ua';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru' 
    ? 'Блог о серебряных украшениях | Daisy Jewellery' 
    : 'Блог про срібні прикраси | Daisy Jewellery';
  const description = lang === 'ru'
    ? 'Полезные статьи о серебряных украшениях, уходе за ними и последних трендах от Daisy Jewellery.'
    : 'Корисні статті про срібні прикраси, догляд за ними та останні тренди від Daisy Jewellery.';
    
  return {
    title,
    description,
    alternates: {
      canonical: `${siteUrl}/${lang}/blog`,
      languages: {
        'uk-UA': `${siteUrl}/uk/blog`,
        'ru-UA': `${siteUrl}/ru/blog`,
      },
    },
    openGraph: {
      title,
      description,
      url: `${siteUrl}/${lang}/blog`,
      type: 'website',
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default function BlogPage({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const posts = getAllHtmlPosts({ lang });

  return (
    <div className={styles.blogWrapper}>
      <div className={styles.blogGrid}>
        {posts.map((post) => (
          <div key={post.slug} className={styles.blogCard}>
            <div className={styles.blogCardHeader}>
              <Link href={`/${lang}/blog/${post.slug}`}>
                <h1>{post.title}</h1>
              </Link>
              <p>{lang === 'ru' ? 'Дата публикации' : 'Дата публікації'}: {post.date}</p>
            </div>
            <div className={styles.blogCardContent}>
              {post.sections.map((section, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: section }} />
              ))}
              <div>
                <Link href={`/${lang}/blog/${post.slug}`} className={styles.readMoreLink}>
                  <h3>{lang === 'ru' ? 'Читать полностью' : 'Читати повністю'}</h3>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


