import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
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
