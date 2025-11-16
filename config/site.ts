/**
 * Site Configuration
 * Global site metadata and settings
 */

export const siteConfig = {
  name: 'Radio Management System',
  description:
    'Complete SaaS platform for radio stations to manage clients, programs, SMS campaigns, and advertising',
  url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  ogImage: '/og-image.png',

  // Features
  features: {
    auth: true,
    subscription: true,
    multiTenant: true,
    sms: true,
    advertising: true,
    analytics: true,
  },

  // Trial configuration
  trial: {
    days: 7,
    allowPaymentAfter: false, // Require payment after trial
  },

  // SMS Configuration
  sms: {
    maxCharacters: 160,
    providers: ['hubtel', 'africas-talking'] as const,
    defaultProvider: 'hubtel' as const,
  },

  // Storage
  storage: {
    maxUploadSize: 100 * 1024 * 1024, // 100MB
    providers: ['s3', 'cloudinary'] as const,
    defaultProvider: 's3' as const,
  },

  // Email
  emailProvider: 'resend',

  // Currency
  currency: {
    default: 'GHS',
    symbol: '₵',
    locale: 'en-GH',
  },

  // Pagination
  pagination: {
    defaultPageSize: 10,
    defaultPage: 1,
  },

  // API
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    timeout: 30000,
  },

  // Links
  links: {
    twitter: 'https://twitter.com',
    facebook: 'https://facebook.com',
    linkedin: 'https://linkedin.com',
    github: 'https://github.com',
  },
}

export type SiteConfig = typeof siteConfig
