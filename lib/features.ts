/**
 * Feature Flags System
 * Defines all lockable features and utilities to check access
 */

export enum Feature {
  // Core Features (Always enabled)
  CLIENTS = 'clients',
  PROGRAMS = 'programs',
  INVOICES = 'invoices',
  CONTRACTS = 'contracts',
  TEAMS = 'teams',
  REPORTS = 'reports',
  ON_AIR = 'on_air',

  // Premium Features (Can be locked)
  SMS_CAMPAIGNS = 'sms_campaigns',
  ADVERTISEMENTS = 'advertisements',
  MEDIA_LIBRARY = 'media_library',
  WHATSAPP_INTEGRATION = 'whatsapp_integration',
  EXPENSES = 'expenses',
  ADVANCED_ANALYTICS = 'advanced_analytics',
  LISTENER_TRACKING = 'listener_tracking',

  // Report Access Features (Premium)
  REPORT_REVENUE = 'report_revenue',
  REPORT_CONTRACTS = 'report_contracts',
  REPORT_AGING = 'report_aging',
  REPORT_CLIENT_ANALYTICS = 'report_client_analytics',
  REPORT_PROGRAM_ANALYTICS = 'report_program_analytics',
  REPORT_SMS_ANALYTICS = 'report_sms_analytics',
}

export interface FeatureDefinition {
  key: Feature
  name: string
  description: string
  icon: string
  premium: boolean // If true, can be locked by admin
  route: string
}

export const FEATURES: Record<Feature, FeatureDefinition> = {
  [Feature.CLIENTS]: {
    key: Feature.CLIENTS,
    name: 'Client Management',
    description: 'Manage your clients and contacts',
    icon: 'Users',
    premium: false,
    route: '/clients',
  },
  [Feature.PROGRAMS]: {
    key: Feature.PROGRAMS,
    name: 'Programs',
    description: 'Manage radio programs and schedules',
    icon: 'Radio',
    premium: false,
    route: '/programs',
  },
  [Feature.INVOICES]: {
    key: Feature.INVOICES,
    name: 'Invoices',
    description: 'Create and manage invoices',
    icon: 'FileText',
    premium: false,
    route: '/invoices',
  },
  [Feature.CONTRACTS]: {
    key: Feature.CONTRACTS,
    name: 'Contracts',
    description: 'Manage client contracts',
    icon: 'FileSignature',
    premium: false,
    route: '/contracts',
  },
  [Feature.TEAMS]: {
    key: Feature.TEAMS,
    name: 'Teams',
    description: 'Manage your team members',
    icon: 'Users',
    premium: false,
    route: '/teams',
  },
  [Feature.REPORTS]: {
    key: Feature.REPORTS,
    name: 'Reports & Analytics',
    description: 'View business reports and analytics',
    icon: 'BarChart3',
    premium: false,
    route: '/reports',
  },
  [Feature.ON_AIR]: {
    key: Feature.ON_AIR,
    name: 'On-Air Dashboard',
    description: 'Live broadcast management',
    icon: 'Radio',
    premium: false,
    route: '/on-air',
  },
  [Feature.SMS_CAMPAIGNS]: {
    key: Feature.SMS_CAMPAIGNS,
    name: 'SMS Campaigns',
    description: 'Send SMS marketing campaigns',
    icon: 'MessageSquare',
    premium: true,
    route: '/sms',
  },
  [Feature.ADVERTISEMENTS]: {
    key: Feature.ADVERTISEMENTS,
    name: 'Advertisement Management',
    description: 'Manage ad campaigns and slots',
    icon: 'Megaphone',
    premium: true,
    route: '/advertising',
  },
  [Feature.MEDIA_LIBRARY]: {
    key: Feature.MEDIA_LIBRARY,
    name: 'Media Library',
    description: 'Store and manage media files',
    icon: 'Image',
    premium: true,
    route: '/media',
  },
  [Feature.WHATSAPP_INTEGRATION]: {
    key: Feature.WHATSAPP_INTEGRATION,
    name: 'WhatsApp Integration',
    description: 'Connect WhatsApp for messaging',
    icon: 'MessageCircle',
    premium: true,
    route: '/settings/whatsapp',
  },
  [Feature.EXPENSES]: {
    key: Feature.EXPENSES,
    name: 'Expense Tracking',
    description: 'Track and manage expenses',
    icon: 'Receipt',
    premium: true,
    route: '/expenses',
  },
  [Feature.ADVANCED_ANALYTICS]: {
    key: Feature.ADVANCED_ANALYTICS,
    name: 'Advanced Analytics',
    description: 'Detailed business intelligence',
    icon: 'TrendingUp',
    premium: true,
    route: '/reports/advanced',
  },
  [Feature.REPORT_REVENUE]: {
    key: Feature.REPORT_REVENUE,
    name: 'Revenue Report',
    description: 'Access to detailed revenue analytics and reporting',
    icon: 'DollarSign',
    premium: true,
    route: '/reports/financial/revenue',
  },
  [Feature.REPORT_CONTRACTS]: {
    key: Feature.REPORT_CONTRACTS,
    name: 'Contract Analysis Report',
    description: 'Access to contract performance and analysis',
    icon: 'FileSignature',
    premium: true,
    route: '/reports/contracts',
  },
  [Feature.REPORT_AGING]: {
    key: Feature.REPORT_AGING,
    name: 'Invoice Aging Report',
    description: 'Access to invoice aging and receivables tracking',
    icon: 'Clock',
    premium: true,
    route: '/reports/financial/aging',
  },
  [Feature.REPORT_CLIENT_ANALYTICS]: {
    key: Feature.REPORT_CLIENT_ANALYTICS,
    name: 'Client Analytics Report',
    description: 'Access to detailed client behavior and metrics',
    icon: 'Users',
    premium: true,
    route: '/reports/clients',
  },
  [Feature.REPORT_PROGRAM_ANALYTICS]: {
    key: Feature.REPORT_PROGRAM_ANALYTICS,
    name: 'Program Analytics Report',
    description: 'Access to program performance analytics',
    icon: 'Radio',
    premium: true,
    route: '/reports/programs',
  },
  [Feature.REPORT_SMS_ANALYTICS]: {
    key: Feature.REPORT_SMS_ANALYTICS,
    name: 'SMS Analytics Report',
    description: 'Access to SMS campaign analytics and metrics',
    icon: 'MessageSquare',
    premium: true,
    route: '/reports/sms',
  },
  [Feature.LISTENER_TRACKING]: {
    key: Feature.LISTENER_TRACKING,
    name: 'Listener Tracking',
    description: 'Track listener engagement and analytics',
    icon: 'Users',
    premium: true,
    route: '/listeners',
  },
}

/**
 * Get all premium (lockable) features
 */
export function getPremiumFeatures(): FeatureDefinition[] {
  return Object.values(FEATURES).filter(f => f.premium)
}

/**
 * Get all core (always enabled) features
 */
export function getCoreFeatures(): FeatureDefinition[] {
  return Object.values(FEATURES).filter(f => !f.premium)
}

/**
 * Check if a feature is enabled for an organization
 */
export function isFeatureEnabled(
  organizationEnabledFeatures: string[],
  feature: Feature
): boolean {
  const featureDef = FEATURES[feature]

  // Core features are always enabled
  if (!featureDef.premium) {
    return true
  }

  // Check if feature is in enabled list
  return organizationEnabledFeatures.includes(feature)
}

/**
 * Parse enabled features from JSON string
 */
export function parseEnabledFeatures(enabledFeaturesJson: string): string[] {
  try {
    const parsed = JSON.parse(enabledFeaturesJson)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

/**
 * Get feature by route
 */
export function getFeatureByRoute(route: string): FeatureDefinition | undefined {
  return Object.values(FEATURES).find(f => route.startsWith(f.route))
}
