import Script from 'next/script';
import { Montserrat } from "next/font/google";
import '../globals.css';
import Header from '../../components/Header/page';
import Footer from '../../components/Footer/page';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter';
import { CartProvider } from '../../context/CartContext';
import PopupManager from '../../components/Popups/PopupManager';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

export async function generateMetadata({ params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';

  if (lang === 'ru') {
    return {
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
          { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16' },
          { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32' },
          { rel: 'manifest', url: '/site.webmanifest' },
        ],
      },
      manifest: '/site.webmanifest',
      robots: { index: true, follow: true, nocache: true },
      alternates: {
        canonical: 'https://daisy-jewellery.com.ua/ru',
        languages: {
          'uk-UA': 'https://daisy-jewellery.com.ua/uk',
          'ru-UA': 'https://daisy-jewellery.com.ua/ru',
        },
      },
      other: {
        'application/ld+json': JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          'name': 'Daisy Jewellery',
          'url': 'https://daisy-jewellery.com.ua/ru',
          'logo': 'https://daisy-jewellery.com.ua/logo_black.png',
        }),
      },
    };
  }

  return {
    metadataBase: new URL('https://daisy-jewellery.com.ua'),
    title: 'Магазин срібних прикрас - Daisy Jewellery',
    description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
    keywords: [
      'Інтернет-магазин',
      'срібні прикраси',
      'каблучки',
      'сережки',
      'кольє',
      'браслети',
    ],
    authors: [{ name: 'A.P.', url: 'https://daisy-jewellery.com.ua' }],
    openGraph: {
      title: 'Магазин срібних прикрас - Daisy Jewellery',
      description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
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
      locale: 'uk_UA',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      site: '@daisy-jewellery.com.ua',
      creator: '@O.P',
      title: 'Магазин срібних прикрас - Daisy Jewellery',
      description: 'Купити срібні прикраси – це легко з Daisy Jewellery. Вишуканість у кожній деталі!',
      image: '/logo_black.png',
      images: ['/logo_black.png'],
    },
    icons: {
      icon: '/favicon.ico',
      shortcut: '/favicon.ico',
      apple: '/apple-touch-icon.png',
      other: [
        { rel: 'icon', url: '/favicon-16x16.png', sizes: '16x16' },
        { rel: 'icon', url: '/favicon-32x32.png', sizes: '32x32' },
        { rel: 'manifest', url: '/site.webmanifest' },
      ],
    },
    manifest: '/site.webmanifest',
    robots: { index: true, follow: true, nocache: true },
    alternates: {
      canonical: 'https://daisy-jewellery.com.ua/uk',
      languages: {
        'uk-UA': 'https://daisy-jewellery.com.ua/uk',
        'ru-UA': 'https://daisy-jewellery.com.ua/ru',
      },
    },
    other: {
      'application/ld+json': JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Daisy Jewellery',
        'url': 'https://daisy-jewellery.com.ua',
        'logo': 'https://daisy-jewellery.com.ua/logo_black.png',
      }),
    },
  };
}

export default async function RootLayout({ children, params }) {
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';

  return (
    <html lang={lang}>
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=G-CGM54TDF2N`}
          strategy="afterInteractive"
        />
        {/* <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !(function(f,b,e,v,n,t,s){
              if(f.fbq) return; n=f.fbq=function(){ n.callMethod ? n.callMethod.apply(n,arguments) : n.queue.push(arguments) };
              if(!f._fbq) f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
              n.queue=[]; t=b.createElement(e); t.async=!0;
              t.src=v; s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
            var pixelId='${process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || ''}';
            if (pixelId) {
              fbq('init', '1054682103372251');
              fbq('track', 'PageView');
            }
          `}
        </Script> */}
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '1054682103372251');
            fbq('track', 'PageView');
          `}
        </Script>
        {/* <Script id="meta-pixel-fbc" strategy="afterInteractive">
          {`
            (function() {
              try {
                var params = new URLSearchParams(window.location.search);
                var fbclid = params.get('fbclid');
                if (!fbclid) return;
                var value = 'fb.1.' + Date.now() + '.' + fbclid;
                var cookie = '_fbc=' + value + '; path=/; max-age=' + (60*60*24*730) + '; SameSite=Lax';
                document.cookie = cookie;
              } catch (e) {}
            })();
          `}
        </Script> */}
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-CGM54TDF2N');
          `}
        </Script>
      </head>
      <body className={montserrat.className}>
        <AppRouterCacheProvider>
          <CartProvider>
            <Header lang={lang} />
            {children}
            <Footer lang={lang} />
            <PopupManager />
          </CartProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}


