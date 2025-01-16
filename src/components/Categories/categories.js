import Link from 'next/link';
import Image from 'next/image';

import styles from './styles.module.css';

export default async function Categories({ lang = 'uk' } = {}) {
  const categories = {
    uk: [
      {
        title: 'Каблучки',
        src: '/categories/ring.webp',
        link: '/uk/kabluchki/1'
      },
      {
        title: 'Сережки',
        src: '/categories/earring.webp',
        link: '/uk/serezhky/1'
      },
      {
        title: 'Кольє',
        src: '/categories/neclackle.webp',
        link: '/uk//kolye/1'
      },
      {
        title: 'Браслети',
        src: '/categories/bracer.webp',
        link: '/uk//braslety/1'
      }
    ],
    ru: [
      {
        title: 'Кольца',
        src: '/categories/ring.webp',
        link: '/ru/koltsa/1'
      },
      {
        title: 'Серьги',
        src: '/categories/earring.webp',
        link: '/ru/sergi/1'
      },
      {
        title: 'Колье',
        src: '/categories/neclackle.webp',
        link: '/ru/kolye/1'
      },
      {
        title: 'Браслеты',
        src: '/categories/bracer.webp',
        link: '/ru/braslety/1'
      }
    ]
  };

  return (
    <div className='container'>
      <div className={styles.categoriesContainer}>
      {categories[lang].map(category => (
        <Link href={category.link} className={styles.category} key={category.title}>
          <div className={styles.square}>
            <picture>
              <Image
                src={category.src}
                alt={`Зображення ${category.title}`}
                fill={true}
                // sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                quality={35}
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
