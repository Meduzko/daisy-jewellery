import Script from 'next/script';
import { Montserrat, Cormorant_Garamond, Manrope } from "next/font/google";
import '../globals.css';
import Header from '../../components/Header/page';
import Footer from '../../components/Footer/page';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';
import { CartProvider } from '../../context/CartContext';
import PopupManager from '../../components/Popups/PopupManager';
import { getSiteUrl, SITE_NAME, OG_LOCALE, DEFAULT_OG_IMAGE } from '../../helpers/seo';

const montserrat = Montserrat({ subsets: ["latin"], weight: ['400'] });

// Typefaces of the homepage redesign, exposed as CSS variables and consumed
// by the redesigned header, footer and homepage sections.
const serif = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
const sans = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-sans',
  display: 'swap',
});

// Site-wide defaults. Every indexable page sets its own title, description,
// canonical/hreflang (alternates) and Open Graph; nothing page-specific lives here,
// so pages without their own metadata (404, checkout) never inherit the homepage canonical.
export async function generateMetadata(props) {
  const params = await props.params;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';
  const ru = lang === 'ru';
  const title = ru ? 'Серебряные украшения — Daisy Jewellery' : 'Срібні прикраси — Daisy Jewellery';

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    applicationName: SITE_NAME,
    openGraph: {
      siteName: SITE_NAME,
      locale: OG_LOCALE[lang],
      type: 'website',
      images: [DEFAULT_OG_IMAGE],
    },
    twitter: { card: 'summary_large_image' },
    icons: {
      icon: [
        { url: '/favicon.ico', sizes: 'any' },
        { url: '/favicon.svg', type: 'image/svg+xml' },
        { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      ],
      apple: '/apple-touch-icon.png',
    },
    manifest: '/site.webmanifest',
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
  };
}

export default async function RootLayout(props) {
  const params = await props.params;
  const { children } = props;
  const lang = params?.lang === 'ru' ? 'ru' : 'uk';

  return (
    <html lang={lang} className={`${serif.variable} ${sans.variable}`}>
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


