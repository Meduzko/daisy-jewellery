// Temporary test endpoint to verify Sentry integration.
// DELETE THIS FILE after confirming Sentry works correctly.
//
// TESTING:
// 1. GET /api/sentry-test - Throws an unhandled error (auto-captured by Sentry)
// 2. POST /api/sentry-test - Demonstrates manual error capture with try/catch
//
// After testing, check your Sentry dashboard for:
// - Error: "Sentry Test Error - Unhandled"
// - Error: "Sentry Test Error - Manual Capture"

import * as Sentry from '@sentry/nextjs';
import { NextRequest, NextResponse } from 'next/server';

// GET: Throws an unhandled error (Sentry auto-captures these)
export async function GET(request: NextRequest) {
  // Add context to the error (request URL and method)
  Sentry.setContext('request', {
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(
      Array.from(request.headers.entries()).filter(
        ([key]) => !['authorization', 'cookie'].includes(key.toLowerCase())
      )
    ),
  });

  // This error will be automatically captured by Sentry
  throw new Error('Sentry Test Error - Unhandled');
}

// POST: Demonstrates manual error capture with try/catch
export async function POST(request: NextRequest) {
  try {
    // Simulate an operation that might fail
    const body = await request.json().catch(() => ({}));
    
    // Force an error for testing
    if (true) {
      throw new Error('Sentry Test Error - Manual Capture');
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Example: Manual error capture with additional context
    // Use this pattern in your route handlers for controlled error handling
    Sentry.captureException(error, {
      tags: {
        route: '/api/sentry-test',
        method: 'POST',
      },
      extra: {
        requestUrl: request.url,
        timestamp: new Date().toISOString(),
      },
      level: 'error',
    });

    // Return error response to client
    return NextResponse.json(
      { 
        error: 'Test error captured',
        message: 'Check Sentry dashboard for the error report',
      },
      { status: 500 }
    );
  }
}

// Example: How to use Sentry.captureException in your code
//
// import * as Sentry from '@sentry/nextjs';
//
// try {
//   await someRiskyOperation();
// } catch (error) {
//   Sentry.captureException(error, {
//     tags: {
//       operation: 'someRiskyOperation',
//       userId: user.id, // Add relevant tags
//     },
//     extra: {
//       input: sanitizedInput, // Don't include sensitive data!
//     },
//   });
//   
//   // Handle the error appropriately
//   throw error; // or return error response
// }
