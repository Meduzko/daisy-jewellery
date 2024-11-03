import { Grid } from '@mui/material';
import PaginationComponent from '../Pagination/index';
import GalleryItem from './GalleryItem';
import GalleryItemMobile from './mobile/GalleryItemMobile';
import styles from './styles.module.css';

export default function Gallery({ items, currentPage, hasMore, withPagination, baseURL, isMobile }) {
  const GalleryComponent = isMobile ? GalleryItemMobile : GalleryItem;
  const spacing = isMobile ? 1 : 6;
  const rowSpacing = isMobile ? 2 : 8;

  return (
    <div className={styles.galleryCnt}>
      <Grid container spacing={spacing} rowSpacing={rowSpacing}>
        {items.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.id || item.product_id}>
            <GalleryComponent item={item} baseURL={baseURL} />
          </Grid>
        ))}
      </Grid>
      {withPagination && <PaginationComponent currentPage={currentPage} hasMore={hasMore} baseURL={baseURL} />}
    </div>
  );
}
