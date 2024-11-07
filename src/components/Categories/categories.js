import Link from 'next/link';
import Image from 'next/image';

import styles from './styles.module.css';

export default async function Categories() {
  const categories = [
    {
      title: 'Каблучки',
      src: '/categories/ring.jpg',
      link: '/category/ring/page/1'
    },
    {
      title: 'Сережки',
      src: '/categories/earring.jpg',
      link: '/category/bracer/page/1'
    },
    {
      title: 'Кольє',
      src: '/categories/neclackle.jpg',
      link: '/category/necklace/page/1'
    },
    {
      title: 'Браслети',
      src: '/categories/bracer.jpg',
      link: '/category/bracer/page/1'
    }
  ];

  return (
    <div className='container'>
      <div className={styles.categoriesContainer}>
      {categories.map(category => (
        <Link href={category.link} className={styles.category} key={category.title}>
          <div className={styles.square}>
            <picture>
              <Image
                src={category.src}
                alt={`Зображення ${category.title}`}
                fill={true}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                className={styles.categoryImg}
              />
            </picture>
            <div className={styles.categoryContent}>
              <h2 className={styles.categoryTitle}>{category.title}</h2>
            </div>
            <div className={styles.categoryBackground} />
          </div>
        </Link>
      ))}
    </div>
    </div>
  );
}
