import { Grid } from '@mui/material';
import PaginationComponent from '../Pagination/index';
import GalleryItem from './GalleryItem';
import styles from './styles.module.css';

export default async function Gallery({
  items,
  currentPage,
  hasMore,
  withPagination,
  baseURL,
  itemBaseURL,
  t = {},
  showSizes,
  lang
}) {
  return (
    <div className={styles.galleryCnt}>
      <Grid container spacing={{ xs: 1, md: 3 }} rowSpacing={{ xs: 2, md: 4 }}>
        {items.map((item) => (
          item.image_path && (
            <Grid item xs={6} sm={6} md={4} key={item.id || item.product_id} className={styles.gridItem}>
              <GalleryItem item={item} baseURL={itemBaseURL || baseURL} t={t} showSizes={showSizes} lang={lang} />
            </Grid>
          )
        ))}
      </Grid>
      {withPagination && <PaginationComponent currentPage={currentPage} hasMore={hasMore} baseURL={baseURL} />}
    </div>
  );
}
