// This file configures Sentry for Edge Runtime (middleware, edge API routes).
// Only needed if you use Edge Runtime features.
//
// Edge runtime has limited Node.js APIs, so this config is minimal.

import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN = process.env.SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,

  enabled: !!SENTRY_DSN,

  environment: process.env.NODE_ENV,

  release: process.env.SENTRY_RELEASE,

  // Lower sample rate for edge (can be high volume)
  tracesSampleRate: 0.05,

  debug: false,
});
