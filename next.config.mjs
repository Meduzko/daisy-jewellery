import { withSentryConfig } from "@sentry/nextjs";

/**
 * LiqPay loads https://static.liqpay.ua/libjs/checkout.js dynamically. Without an explicit
 * script-src-elem (or script-src), browsers fall back to default-src and block it.
 * If you also send CSP from Cloudflare / nginx, merge the same LiqPay hosts there or
 * remove the duplicate header — multiple CSPs must all pass.
 *
 * LiqPay checkout loads Apple Pay JS from applepay.cdn-apple.com when apay is enabled.
 * Checkout may execute scripts from blob: URLs (origin https://www.liqpay.ua) — require blob: in script-src-elem.
 * Privat24 / LiqPay flows may load Matomo from matomo.privatbank.ua.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  [
    "script-src",
    "'self'",
    "'unsafe-inline'",
    "'unsafe-eval'",
    'blob:',
    'https://static.liqpay.ua',
    'https://www.liqpay.ua',
    'https://*.liqpay.ua',
    'https://applepay.cdn-apple.com',
    'https://matomo.privatbank.ua',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://www.google.com',
    'https://connect.facebook.net',
    'https://www.facebook.com',
  ].join(' '),
  [
    'script-src-elem',
    "'self'",
    "'unsafe-inline'",
    'blob:',
    'https://static.liqpay.ua',
    'https://www.liqpay.ua',
    'https://*.liqpay.ua',
    'https://applepay.cdn-apple.com',
    'https://matomo.privatbank.ua',
    'https://www.googletagmanager.com',
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://connect.facebook.net',
  ].join(' '),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  [
    'connect-src',
    "'self'",
    'https://www.liqpay.ua',
    'https://*.liqpay.ua',
    'https://applepay.cdn-apple.com',
    'https://matomo.privatbank.ua',
    'https://apple.com',
    'https://www.apple.com',
    'https://www.google-analytics.com',
    'https://*.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://connect.facebook.net',
    'https://www.facebook.com',
    'https://*.facebook.com',
    'https://*.sentry.io',
    'https://*.ingest.sentry.io',
    'wss://*.ingest.sentry.io',
  ].join(' '),
  "frame-src 'self' https://www.liqpay.ua https://*.liqpay.ua",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self' https://www.liqpay.ua https://*.liqpay.ua",
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Dev: allow loading https://*.ngrok… in the browser (Origin ≠ localhost). Without this,
  // Next.js returns 403 for /_next/* when you open the site via ngrok.
  allowedDevOrigins: [
    '*.ngrok-free.dev',
    '*.ngrok-free.app',
    '*.ngrok.io',
    '*.ngrok.app',
  ],
  images: {
    domains: ['cdn.dntrade.com.ua'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.dntrade.com.ua',
        pathname: '/**',
      },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
  async headers() {
    if (process.env.DISABLE_APP_CSP === '1') {
      return [];
    }
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: CONTENT_SECURITY_POLICY,
          },
        ],
      },
    ];
  },
};

// Sentry configuration for source maps and error tracking
// SENTRY_AUTH_TOKEN is required for source map uploads during build
// Get it from: Sentry Dashboard → Settings → Auth Tokens → Create New Token
const sentryWebpackPluginOptions = {
  // Sentry organization and project (set via env vars)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth token for uploading source maps (required for production builds)
  // Set SENTRY_AUTH_TOKEN in your CI/CD or build environment
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Only upload source maps in production builds
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps to Sentry for better stack traces
  widenClientFileUpload: true,

  // Hide source maps from browser DevTools (recommended for production)
  hideSourceMaps: true,

  // Webpack-specific Sentry options
  bundleSizeOptimizations: {
    excludeDebugStatements: true,
    excludeReplayIframe: true,
    excludeReplayShadowDom: true,
  },
};

// Wrap Next.js config with Sentry
// Source maps are uploaded during build when SENTRY_AUTH_TOKEN is set
export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);
