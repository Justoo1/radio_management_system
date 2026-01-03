/**
 * Subscription-based Access Control
 * Determines what features users can access based on their subscription plan
 */

export type ReportType =
  | 'financial-dashboard'
  | 'profit-loss'
  | 'expenses'
  | 'revenue'
  | 'contracts'
  | 'aging'
  | 'clients'
  | 'programs'
  | 'sms'

export type SubscriptionPlan = 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'

// Define report access per plan
const REPORT_ACCESS: Record<SubscriptionPlan, ReportType[]> = {
  STARTER: [
    'financial-dashboard',
    'profit-loss',
    'expenses',
  ],
  PROFESSIONAL: [
    'financial-dashboard',
    'profit-loss',
    'expenses',
    'revenue',
    'contracts',
    'aging',
    'clients',
    'programs',
    'sms',
  ],
  ENTERPRISE: [
    'financial-dashboard',
    'profit-loss',
    'expenses',
    'revenue',
    'contracts',
    'aging',
    'clients',
    'programs',
    'sms',
  ],
}

/**
 * Check if a user has access to a specific report
 */
export function hasReportAccess(plan: string | null | undefined, reportType: ReportType): boolean {
  if (!plan) return false

  // Map plan name to our types (case insensitive)
  const normalizedPlan = plan.toUpperCase() as SubscriptionPlan

  // If plan not found, default to STARTER
  const accessList = REPORT_ACCESS[normalizedPlan] || REPORT_ACCESS.STARTER

  return accessList.includes(reportType)
}

/**
 * Get all accessible reports for a plan
 */
export function getAccessibleReports(plan: string | null | undefined): ReportType[] {
  if (!plan) return REPORT_ACCESS.STARTER

  const normalizedPlan = plan.toUpperCase() as SubscriptionPlan
  return REPORT_ACCESS[normalizedPlan] || REPORT_ACCESS.STARTER
}

/**
 * Get locked reports for a plan (reports not accessible)
 */
export function getLockedReports(plan: string | null | undefined): ReportType[] {
  const accessible = getAccessibleReports(plan)
  const allReports: ReportType[] = [
    'financial-dashboard',
    'profit-loss',
    'expenses',
    'revenue',
    'contracts',
    'aging',
    'clients',
    'programs',
    'sms',
  ]

  return allReports.filter(report => !accessible.includes(report))
}

/**
 * Get upgrade message for a locked report
 */
export function getUpgradeMessage(reportType: ReportType): string {
  const messages: Record<ReportType, string> = {
    'financial-dashboard': 'Upgrade to access Financial Dashboard',
    'profit-loss': 'Upgrade to access Profit & Loss Report',
    'expenses': 'Upgrade to access Expenses Report',
    'revenue': 'Upgrade to Professional plan to access Revenue Report',
    'contracts': 'Upgrade to Professional plan to access Contracts Analysis',
    'aging': 'Upgrade to Professional plan to access Invoice Aging Report',
    'clients': 'Upgrade to Professional plan to access Client Analytics',
    'programs': 'Upgrade to Professional plan to access Programs Report',
    'sms': 'Upgrade to Professional plan to access SMS Analytics',
  }

  return messages[reportType] || 'Upgrade to access this report'
}
