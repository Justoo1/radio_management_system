/**
 * Global Error Page
 * Handles unhandled errors in the application
 */

'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error for debugging
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="en">
      <head>
        <title>Something went wrong</title>
        <style>{`
          body {
            margin: 0;
            padding: 0;
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          }
        `}</style>
      </head>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '16px',
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '448px',
          }}>
            <h1 style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '16px',
              margin: 0,
            }}>500</h1>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: '#e2e8f0',
              marginBottom: '16px',
              margin: '16px 0',
            }}>
              Something Went Wrong
            </h2>
            <p style={{
              color: '#94a3b8',
              marginBottom: '32px',
              margin: '32px 0',
            }}>
              An unexpected error occurred. Please try again or contact support if the problem persists.
            </p>
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
            }}>
              <button
                onClick={() => reset()}
                style={{
                  background: '#2563eb',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  background: '#475569',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  )
}
