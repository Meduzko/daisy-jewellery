import { Montserrat } from "next/font/google";
import "./globals.css";
// import Header from './components/Header/page';
import Header from '../components/Header/page';
import Footer from '../components/Footer/page';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { CartProvider } from '../context/CartContext';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

export const metadata = {
  title: 'Магазин срібних прикрас - Daisy Jewellery',
  description: "Срібні товар на будь який смак",
  keywords: ['jewellery', 'daisy jewellery', 'срібло', 'срібні каблучки', 'срібні сережки', 'срібні кольє', 'срібні браслети'],
  authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua' }],
  openGraph: {
    title: 'Daisy Jewellery',
    description: "Срібні товар на будь який смак",
    url: 'https://daisy-jewellery.com.ua',
    siteName: 'Daisy Jewellery',
    images: [
      {
        url: 'https://daisy-jewellery.com.ua/logo_black.png',
        width: 800,
        height: 600,
        alt: 'Магазин срібних прикрас - Daisy Jewellery',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@daisyjewellery',
    creator: '@yourtwitterhandle',
    title: 'Daisy Jewellery - Handcrafted Elegance',
    description: 'Discover the finest handcrafted jewellery at Daisy Jewellery.',
    images: ['https://daisy-jewellery.com.ua/twitter-image.jpg'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: [
      {
        rel: 'icon',
        url: '/favicon-16x16.png',
        sizes: '16x16',
      },
      {
        rel: 'icon',
        url: '/favicon-32x32.png',
        sizes: '32x32',
      },
      {
        rel: 'manifest',
        url: '/site.webmanifest',
      },
    ],
  },
  manifest: '/site.webmanifest',
  robots: {
    index: true,
    follow: true,
    nocache: true,
  },
  alternates: {
    canonical: 'https://daisy-jewellery.com.ua',
    languages: {
      'uk-UA': 'https://daisy-jewellery.com.ua/uk-UA',
    },
  },
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
