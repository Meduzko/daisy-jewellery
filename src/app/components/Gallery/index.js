import { Grid } from '@mui/material';
import PaginationComponent from '../Pagination'; // Import the Client Component
import GalleryItem from './gallery-item';
import styles from './styles.module.css';

export default function Gallery({ items, totalPages, page, withPagination, itemLinkBaseURL }) {
  return (
    <div className={styles.galleryCnt}>
      <Grid container spacing={6} rowSpacing={8}>
        {items.map((item) => (
          <Grid item xs={6} sm={6} md={3} key={item.id || item.product_id}>
            <GalleryItem item={item} itemLinkBaseURL={itemLinkBaseURL} />
          </Grid>
        ))}
      </Grid>
      {withPagination && <PaginationComponent totalPages={totalPages} currentPage={page} />}
    </div>
  );
}
