// import Image from "next/image";
// import styles from "./page.module.css";
// import Link from "next/link";
// import Navigation from './components/Navigation/page';
// import { BasketProvider } from './context/BasketContext';
// import Header from './components/Header/page';
// import Footer from './components/Footer/page';

import Banner from './components/Banner/page';
import RingsSlider from './components/RingsSlider/index';
// import SwiperCarousel from './components/SwiperCarousel/carousel';
import Categories from './components/Categories/categories';

export default function Home() {
  return (
    <>
      {/* <Header /> */}
      <main className="main">
        {/* <Navigation /> */}
        <Banner />
        <RingsSlider />
        <Categories />
      </main>
      {/* <Footer /> */}
    </>
  );
}

/*
<div className="featured-products">
<h2>Featured Products</h2>
<div className="products-grid">
  <div className="product-card">
    <h3>Product Name</h3>
    <p>$99.99</p>
  </div>
</div>
</div>
*/

// export default function Home() {
//   return (
//     <main>
//       <div>
//         <h1>Home page</h1>
//         <Link href="/category/bracer">Bracer</Link>
//         <Link href="/category/necklace">Necklace</Link>
//         <Link href="/category/ring">Ring</Link>
//       </div>
//     </main>
//   );
// }
