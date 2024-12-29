import Link from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

import styles from './styles.module.css';

export default function PaginationComponent({ currentPage, hasMore, baseURL }) {
  const nextPage = hasMore ? currentPage + 1 : currentPage;
  const prevPage = currentPage > 1 ? currentPage - 1 : currentPage;

  return (
    <div className={styles.pagination}>
      <Link
        // href={`${baseURL}/page/${prevPage}`}
        href={`${baseURL}/${prevPage}`}
        {...(currentPage === 1 ? { className: styles.disabled } : {})}
      >
        <NavigateBeforeIcon />
        <span>Попередня</span>
      </Link>
      <span className={styles.currentPage}>{currentPage}</span>
      <Link
        // href={`${baseURL}/page/${nextPage}`}
        href={`${baseURL}/${nextPage}`}
        {...(!hasMore ? { className: styles.disabled } : {})}
      >
        <span>Наступна</span>
        <NavigateNextIcon />
      </Link>
    </div>
  );
}
