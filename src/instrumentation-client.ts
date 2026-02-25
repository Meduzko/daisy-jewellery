// This file configures Sentry for client-side (browser) error tracking.
// It runs in the browser and captures frontend errors.
//
// SETUP:
// - Set NEXT_PUBLIC_SENTRY_DSN in your .env.local (must be NEXT_PUBLIC_ for client access)
// - Get your DSN from: Sentry Dashboard → Settings → Projects → [Your Project] → Client Keys (DSN)
//
// TESTING IN PRODUCTION:
// - Visit /api/sentry-test to trigger a test error
// - Open browser console and run: throw new Error('Test client error')
// - Check Sentry dashboard for errors within a few minutes
//
// DISABLE IN DEVELOPMENT:
// - Remove or don't set NEXT_PUBLIC_SENTRY_DSN in local .env
// - Or set enabled: false in the init config below

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Only enable Sentry when DSN is provided
  enabled: !!SENTRY_DSN,

  // Environment tagging (production/staging/development)
  environment: process.env.NODE_ENV,

  // Release tracking - set via SENTRY_RELEASE env var during build
  release: process.env.NEXT_PUBLIC_SENTRY_RELEASE || process.env.SENTRY_RELEASE,

  // Performance monitoring (low overhead - 10% of transactions)
  // Adjust based on traffic. For high-traffic sites, use 0.01-0.05
  tracesSampleRate: 0.1,

  // Replay configuration for debugging (captures user sessions on errors)
  // Disabled by default to reduce overhead. Enable if needed.
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Filter out sensitive data from error reports
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    // Remove sensitive data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
        if (breadcrumb.data) {
          const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'authorization'];
          sensitiveKeys.forEach((key) => {
            if (breadcrumb.data && key in breadcrumb.data) {
              breadcrumb.data[key] = '[FILTERED]';
            }
          });
        }
        return breadcrumb;
      });
    }

    return event;
  },

  // Ignore common non-actionable errors
  ignoreErrors: [
    // Browser extensions
    /chrome-extension/,
    /moz-extension/,
    // Network errors that are usually transient
    'Network request failed',
    'Load failed',
    'Failed to fetch',
    // User-triggered navigation
    'AbortError',
    'ResizeObserver loop',
  ],

  // Add request URL to errors
  beforeBreadcrumb(breadcrumb) {
    if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
      // Mask any API keys in URLs
      if (breadcrumb.data?.url) {
        breadcrumb.data.url = breadcrumb.data.url.replace(
          /([?&](api[_-]?key|token|secret|password)=)[^&]*/gi,
          '$1[FILTERED]'
        );
      }
    }
    return breadcrumb;
  },

  debug: false,
});

// Export for Next.js router transition instrumentation
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
