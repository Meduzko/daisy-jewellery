// This file configures Sentry for server-side error tracking (SSR, API routes, Server Actions).
// It runs on the Node.js server.
//
// SETUP:
// - Set SENTRY_DSN in your .env.local (server-side only, no NEXT_PUBLIC_ prefix needed)
// - Get your DSN from: Sentry Dashboard → Settings → Projects → [Your Project] → Client Keys (DSN)
//
// PM2 COMPATIBILITY:
// - This config is fully compatible with pm2
// - Works with `pm2 start npm -- start` or ecosystem.config.js
// - Ensure env vars are passed via pm2 config or .env file
//
// TESTING:
// - Visit /api/sentry-test to trigger a server-side error
// - Check Sentry dashboard for errors

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  // Only enable Sentry when DSN is provided
  enabled: !!SENTRY_DSN,

  // Environment tagging
  environment: process.env.NODE_ENV,

  // Release tracking
  release: process.env.SENTRY_RELEASE,

  // Performance monitoring (low overhead)
  tracesSampleRate: 0.1,

  // Filter out sensitive data
  beforeSend(event) {
    // Remove sensitive headers
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
      delete event.request.headers['x-api-key'];
    }

    // Remove sensitive cookies
    if (event.request?.cookies) {
      event.request.cookies = {};
    }

    // Mask query params that might contain sensitive data
    if (event.request?.query_string && typeof event.request.query_string === 'string') {
      event.request.query_string = event.request.query_string.replace(
        /([?&](api[_-]?key|token|secret|password)=)[^&]*/gi,
        '$1[FILTERED]'
      );
    }

    return event;
  },

  // Automatically capture unhandled exceptions and rejections
  // These are enabled by default, but making it explicit
  integrations: (integrations) => {
    return integrations;
  },

  debug: false,
});
