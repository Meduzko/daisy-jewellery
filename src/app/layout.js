import { Montserrat } from "next/font/google";
import "./globals.css";
// import Header from './components/Header/page';
import Header from '../components/Header/page';
import Footer from '../components/Footer/page';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v13-appRouter';
import { CartProvider } from '../context/CartContext';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

// export const metadata = {
//   title: 'Магазин срібних прикрас - Daisy Jewellery',
//   description: "Срібні прикраси на будь який смак",
//   keywords: ['jewellery', 'daisy jewellery', 'срібло', 'срібні каблучки', 'срібні сережки', 'срібні кольє', 'срібні браслети'],
//   authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua' }],
//   openGraph: {
//     title: 'Daisy Jewellery',
//     description: "Срібні прикраси на будь який смак",
//     url: 'https://daisy-jewellery.com.ua',
//     siteName: 'Daisy Jewellery',
//     images: [
//       {
//         url: '/logo_black.png',
//         width: 800,
//         height: 600,
//         alt: 'Магазин срібних прикрас - Daisy Jewellery',
//       },
//     ],
//     locale: 'en_US',
//     type: 'website',
//   },
//   twitter: {
//     card: 'summary_large_image',
//     site: '@daisy-jewellery.com.ua',
//     creator: '@O.P',
//     title: 'Daisy Jewellery - Магазин срібних прикрас',
//     description: 'Срібні прикраси на будь який смак',
//     image: '/logo_black.png',
//     images: ['/logo_black.png'],
//   },
//   icons: {
//     icon: '/favicon.ico',
//     shortcut: '/favicon.ico',
//     apple: '/apple-touch-icon.png',
//     other: [
//       {
//         rel: 'icon',
//         url: '/favicon-16x16.png',
//         sizes: '16x16',
//       },
//       {
//         rel: 'icon',
//         url: '/favicon-32x32.png',
//         sizes: '32x32',
//       },
//       {
//         rel: 'manifest',
//         url: '/site.webmanifest',
//       },
//     ],
//   },
//   manifest: '/site.webmanifest',
//   robots: {
//     index: true,
//     follow: true,
//     nocache: true,
//   },
//   alternates: {
//     canonical: 'https://daisy-jewellery.com.ua',
//     languages: {
//       'uk-UA': 'https://daisy-jewellery.com.ua/uk-UA',
//     },
//   },
// };

export const metadata = {
  metadataBase: new URL('https://daisy-jewellery.com.ua'),
  title: 'Магазин срібних прикрас - Daisy Jewellery',
  description: 'Срібні прикраси на будь-який смак',
  keywords: [
    'jewellery',
    'daisy jewellery',
    'срібло',
    'купити',
    'купити сріні прикраси',
    'срібні прикраси',
    'срібні каблучки',
    'срібні сережки',
    'срібні кольє',
    'срібні браслети',
    'каблучки',
    'сережки',
    'кольє',
    'браслети'
  ],
  authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua' }],
  openGraph: {
    title: 'Daisy Jewellery',
    description: 'Срібні прикраси на будь-який смак',
    url: 'https://daisy-jewellery.com.ua',
    siteName: 'Daisy Jewellery',
    images: [
      {
        url: '/logo_black.png',
        width: 800,
        height: 600,
        alt: 'Магазин срібних прикрас - Daisy Jewellery',
      },
    ],
    locale: 'uk_UA', // Updated locale for Ukrainian language
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@daisy-jewellery.com.ua',
    creator: '@O.P',
    title: 'Daisy Jewellery - Магазин срібних прикрас',
    description: 'Срібні прикраси на будь-який смак',
    image: '/logo_black.png',
    images: ['/logo_black.png'],
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
  other: {
    // Added structured data for your logo
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Daisy Jewellery',
      'url': 'https://daisy-jewellery.com.ua',
      'logo': 'https://daisy-jewellery.com.ua/logo_black.png',
    }),
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
