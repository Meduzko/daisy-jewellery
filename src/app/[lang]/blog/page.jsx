import Link from 'next/link';
import { getAllHtmlPosts } from '../../../lib/posts';
import { getDefaultMetaData } from '../../../helpers';
import styles from '../../../styles/BlogPage.module.css';

export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'Блог о серебряных украшениях | Daisy Jewellery'
    : 'Блог про срібні прикраси | Daisy Jewellery';
  const description = lang === 'ru'
    ? 'Статьи Daisy Jewellery: как узнать размер кольца и какое серебряное украшение выбрать в подарок на 14 февраля и 8 марта.'
    : 'Статті Daisy Jewellery: як визначити розмір каблучки та яку срібну прикрасу обрати в подарунок на 14 лютого і 8 березня.';

  return getDefaultMetaData({ pagePath: 'blog', title, description, lang });
}

export default async function BlogPage(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const posts = getAllHtmlPosts({ lang });

  return (
    <div className={styles.blogWrapper}>
      <h1 className={styles.visuallyHidden}>{lang === 'ru' ? 'Блог Daisy Jewellery о серебряных украшениях' : 'Блог Daisy Jewellery про срібні прикраси'}</h1>
      <div className={styles.blogGrid}>
        {posts.map((post) => (
          <div key={post.slug} className={styles.blogCard}>
            <div className={styles.blogCardHeader}>
              <Link href={`/${lang}/blog/${post.slug}`}>
                <h2 className={styles.cardTitle}>{post.title}</h2>
              </Link>
              <p>{lang === 'ru' ? 'Дата публикации' : 'Дата публікації'}: {post.date}</p>
            </div>
            <div className={styles.blogCardContent}>
              {post.sections.map((section, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: section }} />
              ))}
              <div>
                <Link href={`/${lang}/blog/${post.slug}`} className={styles.readMoreLink}>
                  <span className={styles.readMore}>{lang === 'ru' ? 'Читать полностью' : 'Читати повністю'}</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
