// import dynamic from 'next/dynamic';
import { Grid } from '@mui/material';
import PaginationComponent from '../Pagination/index';
import GalleryItem from './GalleryItem';
import GalleryItemMobile from './mobile/GalleryItemMobile';
import styles from './styles.module.css';

// const GalleryItem = dynamic(() => import('./GalleryItem'), { ssr: false });
// const GalleryItemMobile = dynamic(() => import('./mobile/GalleryItemMobile'), { ssr: false });

export default async function Gallery({
  items,
  currentPage,
  hasMore,
  withPagination,
  baseURL,
  itemBaseURL,
  isMobile,
  t = {},
  showSizes,
  lang
}) {
  const GalleryComponent = isMobile ? GalleryItemMobile : GalleryItem;
  const spacing = isMobile ? 1 : 6;
  const rowSpacing = isMobile ? 4 : 8;

  return (
    <div className={styles.galleryCnt}>
      <Grid container spacing={spacing} rowSpacing={rowSpacing}>
        {items.map((item) => (
          item.image_path && (
            <Grid item xs={12} sm={6} md={4} key={item.id || item.product_id}>
              <GalleryComponent item={item} baseURL={itemBaseURL || baseURL} t={t} showSizes={showSizes} lang={lang} />
            </Grid>
          )
        ))}
      </Grid>
      {withPagination && <PaginationComponent currentPage={currentPage} hasMore={hasMore} baseURL={baseURL} />}
    </div>
  );
}
