import Link from 'next/link';
import Image from 'next/image';
import Navigation from '../Navigation/page';
import BasketDrawer from '../Basket/basket';
import styles from './styles.module.css';

export default async function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Link href='/'>
          <Image
                src="/apm-logo-dark.svg"
                alt="logo"
                width={80}
                height={45}
                className={styles.logo}
              />
        </Link>
        <BasketDrawer />
      </div>
      <Navigation />
    </header>
  );
}
