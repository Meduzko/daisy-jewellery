// This file initializes Sentry on the server side.
// It's called automatically by Next.js during server startup.
//
// The register() function is called once when a new Node.js runtime is started.
// This ensures Sentry is initialized before any request handling.

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Import server config for Node.js runtime (SSR, API routes, Server Actions)
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Import edge config for Edge runtime (middleware, edge routes)
    await import('../sentry.edge.config');
  }
}
