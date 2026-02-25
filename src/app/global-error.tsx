// This component catches errors in the root layout and reports them to Sentry.
// It acts as a global error boundary for the entire application.
//
// This is required for App Router to properly capture and report errors.
// The error is automatically captured by Sentry via the captureException call.

'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Capture the error in Sentry with additional context
    Sentry.captureException(error, {
      tags: {
        errorBoundary: 'global',
      },
      extra: {
        digest: error.digest,
      },
    });
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ marginBottom: '16px' }}>Щось пішло не так</h2>
          <p style={{ marginBottom: '24px', color: '#666' }}>
            Виникла несподівана помилка. Ми вже працюємо над її вирішенням.
          </p>
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 24px',
              backgroundColor: '#000',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Спробувати знову
          </button>
        </div>
      </body>
    </html>
  );
}
