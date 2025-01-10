import Link from 'next/link';
import { getAllHtmlPosts } from '../../lib/posts';
import styles from '../../styles/BlogPage.module.css';

export default function BlogPage() {
  const posts = getAllHtmlPosts();

  return (
    <div className={styles.blogWrapper}>
      <div className={styles.blogGrid}>
        {posts.map((post) => (
          <div key={post.slug} className={styles.blogCard}>
            <div className={styles.blogCardHeader}>
              <Link href={`/blog/${post.slug}`}>
                <h1>{post.title}</h1>
              </Link>
              <p>{post.date}</p>
            </div>
            <div className={styles.blogCardContent}>
              {post.sections.map((section, index) => (
                <div key={index} dangerouslySetInnerHTML={{ __html: section }} />
              ))}
              <div>
                <Link href={`/blog/${post.slug}`} className={styles.readMoreLink}>
                  <h3>Читати повністю</h3>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}











// import Link from 'next/link';
// import { getAllHtmlPosts } from '../../lib/posts';

// export default function BlogPage() {
//   const posts = getAllHtmlPosts();

//   return (
//     <div>
//       <h1>Blog</h1>
//       <ul>
//         {posts.map((post) => (
//           <li key={post.slug}>
//             <Link href={`/blog/${post.slug}`}>
//               <h2>{post.title}</h2>
//             </Link>
//             <p>{post.excerpt}</p> {/* Display the excerpt */}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
