import { Montserrat } from "next/font/google";
import "./globals.css";
// import Header from './components/Header/page';
import Header from '../components/Header/page';
import Footer from '../components/Footer/page';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { CartProvider } from '../context/CartContext';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

export const metadata = {
  title: "Магазин Daisy Jewellery",
  description: "Срібні товар на будь який смак",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={montserrat.className}>
        <AppRouterCacheProvider>
          <CartProvider>
            <Header />
            {children}
            <Footer />
          </CartProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
