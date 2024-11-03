import Link from 'next/link';
import Image from 'next/image';
import styles from './styles.module.css';

export default function Banner() {
  return (
    <div className={styles.bannerContainer}>
      <Image
        src="/banner.jpg"
        alt="Main banner"
        layout="fill"
        objectFit="cover" // Keeps the image covering the whole area
        priority={true} // Ensures it loads immediately for performance
        quality={90} // Adjust quality to balance performance and clarity
      />
      <div className={styles.bannerBackground}>
        {/* <h1><Link className={styles.bannerLink} href="/">Перейти до категорій</Link></h1> */}
      </div>
    </div>
  )
  // return (
  //   <div className={styles.banner}>
  //     <div className={styles.bannerContent}>
  //       <h1 className={styles.bannerTitle}>Welcome to Daisy jewellery</h1>
  //       <div className={styles.bannerLinkCnt}>
  //         <Link className={styles.bannerLink} href="/">Перейти до категорій</Link>
  //       </div>
  //     </div>
  //   </div>
  // );
}
