import Link from 'next/link';
import { getAllHtmlPosts } from '../../../lib/posts';
import styles from '../../../styles/BlogPage.module.css';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return {
    alternates: {
      canonical: `${process.env.SITE_DOMAIN}/${lang}/blog`,
    }
  }
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


