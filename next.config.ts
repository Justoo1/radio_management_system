import type { NextConfig } from "next";
// @ts-ignore - next-pwa types are incompatible with Next.js 16
import withPWA from 'next-pwa';

const nextConfig: NextConfig = {
  // Empty turbopack config to silence the warning
  // PWA requires webpack, so we use webpack in production builds
  turbopack: {},
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
  // @ts-ignore - next-pwa types are incompatible with Next.js 16
})(nextConfig);
