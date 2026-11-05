import { getHomeProducts } from '../../../lib/homeProducts';
import { NEW_PRODUCTS } from '../config';
import { getHomeCopy } from '../copy';
import NewArrivalsGrid from './NewArrivalsGrid';
import ui from '../ui.module.css';
import styles from './NewArrivals.module.css';

export default async function NewArrivals({ lang = 'uk' }) {
  const copy = getHomeCopy(lang);
  const t = copy.arrivals;
  const products = await getHomeProducts(NEW_PRODUCTS, lang);

  if (!products.length) return null;

  return (
    <section id="novynky" className={styles.section} aria-labelledby="novynky-title">
      <NewArrivalsGrid
        products={products}
        currency={copy.currency}
        labels={t}
        heading={
          <div className={styles.heading}>
            <p className={ui.eyebrow}>{t.eyebrow}</p>
            <h2 id="novynky-title" className={ui.h2}>{t.title}</h2>
          </div>
        }
      />
    </section>
  );
}
