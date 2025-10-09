import Link from "next/link"
import { IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import TelegramIcon from '@mui/icons-material/Telegram';
import FacebookIcon from '@mui/icons-material/Facebook';
import { getDefaultMetaData } from '../../../helpers';
import styles from './styles.module.css';

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const title = lang === 'ru'
    ? 'Магазин серебряных украшений - Daisy Jewellery | Контакты'
    : 'Магазин срібних прикрас - Daisy Jewellery | Контакти';
  return getDefaultMetaData({ pagePath: 'contact', title, lang });
}

export default function AboutPage({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  return (
    <div className={styles.container}>
      <h1 className={styles.mainTitle}>{lang === 'ru' ? 'Обратная связь' : 'Зворотній зв\'язок'}</h1>
      <p>Email: <a href="mailto:daisyjewellery.info@gmail.com">daisyjewellery.info@gmail.com</a></p>
      <p>Телефон: <a href="tel:+380935492986">+380935492986</a></p>
      <div className={styles.socialContainer}>
        <p>{lang === 'ru' ? 'Мы в социальных сетях:' : 'Ми в соціальних мережах:'}</p>
        <div className={styles.footerSocials}>
          <Link href="https://www.instagram.com/daisy.jewellery" aria-label="Instagram link">
            <IconButton className={styles.social} aria-label="Instagram">
              <InstagramIcon />
            </IconButton>
          </Link>
          <IconButton className={styles.social} aria-label="Telegram">
            <TelegramIcon />
          </IconButton>
          <Link href="https://www.facebook.com/profile.php?id=100085472847797" aria-label="Facebook link">
            <IconButton className={styles.social} aria-label="Facebook">
              <FacebookIcon />
            </IconButton>
          </Link>
        </div>
      </div>
    </div>
  )
}


