import { Grid } from '@mui/material';
import PaginationComponent from '../Pagination/index';
import GalleryItem from './GalleryItem';
import GalleryItemMobile from './mobile/GalleryItemMobile';
import styles from './styles.module.css';

export default async function Gallery({
  items,
  currentPage,
  hasMore,
  withPagination,
  baseURL,
  itemBaseURL,
  isMobile,
  t = {}
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
              <GalleryComponent item={item} baseURL={itemBaseURL || baseURL} t={t} />
            </Grid>
          )
        ))}
      </Grid>
      {withPagination && <PaginationComponent currentPage={currentPage} hasMore={hasMore} baseURL={baseURL} />}
    </div>
  );
}
