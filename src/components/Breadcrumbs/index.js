import Link from 'next/link';
import styles from './styles.module.css';

export default function Breadcrumbs({ segments }) {
  return (
    <nav aria-label="Breadcrumb" className={styles.nav}>
      <ol>
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          return (
            <li key={segment.name}>
              {!isLast ? (
                <Link href={segment.href} className={styles.linkItem}>
                  {segment.name}
                </Link>
              ) : (
                <span>{segment.name}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
