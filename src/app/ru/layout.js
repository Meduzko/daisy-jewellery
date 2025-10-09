import Script from 'next/script';
import { Montserrat } from "next/font/google";
import '../globals.css';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { CartProvider } from '../../context/CartContext';
// import Header from './components/Header/page';
import Header from '../../components/Header/page';
import Footer from '../../components/Footer/page';
import PopupManager from '../../components/Popups/PopupManager';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

export const metadata = {
  metadataBase: new URL('https://daisy-jewellery.com.ua/ru'),
  title: 'Магазин серебряных украшений - Daisy Jewellery',
  description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
  keywords: [
    'Інтернет-магазин',
    'срібні прикраси',
    'каблучки',
    'сережки',
    'кольє',
    'браслети',
  ],
  authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua/ru' }],
  openGraph: {
    title: 'Магазин серебряных украшений - Daisy Jewellery',
    description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
    url: 'https://daisy-jewellery.com.ua/ru',
    siteName: 'Daisy Jewellery',
    images: [
      {
        url: '/logo_black.png',
        width: 800,
        height: 600,
        alt: 'Магазин серебряных украшений - Daisy Jewellery',
      },
    ],
    locale: 'ru_UA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@daisy-jewellery.com.ua',
    creator: '@O.P',
    title: 'Магазин серебряных украшений - Daisy Jewellery',
    description: 'Купить серебряные украшения - это легко с Daisy Jewellery. Изысканность в каждой детали!',
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
    canonical: 'https://daisy-jewellery.com.ua/ru',
    languages: {
      'uk-UA': 'https://daisy-jewellery.com.ua/uk',
      'ru-UA': 'https://daisy-jewellery.com.ua/ru',
    },
  },
  other: {
    // Added structured data for your logo
    'application/ld+json': JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Organization',
      'name': 'Daisy Jewellery',
      'url': 'https://daisy-jewellery.com.ua/ru',
      'logo': 'https://daisy-jewellery.com.ua/logo_black.png',
    }),
  },
};

export default async function RootLayout({ children }) {
  return (
    <html lang="ru">
      <head>
        {/* Other head elements can be included here */}
        {/* Google Analytics Script */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-CGM54TDF2N`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-CGM54TDF2N');
          `}
        </Script>
        {/* Google Analytics Script ad*/}
        {/* <Script async src="https://www.googletagmanager.com/gtag/js?id=AW-16818177431" />
        <Script id="google-analytics-ads">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'AW-16818177431');
          `}
        </Script> */}
      </head>
      <body className={montserrat.className}>
        <AppRouterCacheProvider>
          <CartProvider>
            <Header lang="ru" />
            {children}
            <Footer lang="ru" />
            <PopupManager />
          </CartProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
