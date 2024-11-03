import Link from 'next/link';
import styles from './styles.module.css';

export default async function Categories() {
  const categories = [
    {
      title: 'Каблучки',
      src: '/categories/watch.webp',
      link: '/category/ring'
    },
    {
      title: 'Кольє',
      src: '/categories/necle.webp',
      link: 'category/necles'
    },
    {
      title: 'Браслети',
      src: '/categories/parfume.webp',
      link: 'category/bracer'
    }
  ]

  return (
    <div className='container'>
      <div className={styles.categoriesContainer}>
      {categories.map(category => (
        <Link href={category.link} className={styles.category} key={category.title}>
          <div className={styles.square}>
            <picture>
              <img
                fetch-priority="high"
                src={category.src}
                alt={category.title}
                className={styles.categoryImg}
              />
            </picture>
            <div className={styles.categoryContent}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
            </div>
          </div>
        </Link>
      ))}
    </div>
    </div>
  );
}
