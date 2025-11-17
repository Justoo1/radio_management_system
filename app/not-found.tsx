/**
 * Not Found Page
 * 404 error page
 */

import Link from 'next/link'

export const metadata = {
  title: '404 - Page Not Found',
  description: 'The page you are looking for does not exist.',
}

export default function NotFound() {
  return (
    <html lang="en">
      <head>
        <title>404 - Not Found</title>
      </head>
      <body className="bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-slate-200 mb-4">Page Not Found</h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link
              href="/"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Go Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
