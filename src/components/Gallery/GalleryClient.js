'use client';

// import dynamic from 'next/dynamic';
import { Grid } from '@mui/material';
import PaginationComponent from '../Pagination';
import GalleryClientItem from './GalleryClientItem';
import GalleryItemMobile from './mobile/GalleryClientItemMobile';
import styles from './styles.module.css';

// const GalleryItemMobile = dynamic(() => import('./mobile/GalleryItemMobile'), { ssr: false });

export default function Gallery({
  items,
  currentPage,
  hasMore,
  withPagination,
  baseURL,
  itemBaseURL,
  isMobile,
  t = {},
}) {
  const spacing = isMobile ? 1 : 6;
  const rowSpacing = isMobile ? 4 : 8;

  return (
    <div className={styles.galleryCnt}>
      <Grid container spacing={spacing} rowSpacing={rowSpacing}>
        {items.map((item) => (
          item.image_path && (
            <Grid item xs={12} sm={6} md={4} key={item.id || item.product_id}>
              {isMobile ? (
                <GalleryItemMobile item={item} baseURL={itemBaseURL || baseURL} t={t} />
              ) : (
                <GalleryClientItem item={item} baseURL={itemBaseURL || baseURL} t={t} />
              )}
            </Grid>
          )
        ))}
      </Grid>
      {withPagination && (
        <PaginationComponent
          currentPage={currentPage}
          hasMore={hasMore}
          baseURL={baseURL}
        />
      )}
    </div>
  );
}