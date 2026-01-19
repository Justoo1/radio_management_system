/**
 * Store Exports
 * Centralized exports for all Zustand stores
 */

export { useAuthStore, type AuthState, type User } from './auth.store'
export {
  useOrganizationStore,
  type OrganizationState,
  type Organization,
  type Subscription,
} from './organization.store'
export {
  useUIStore,
  type UIState,
  type Toast,
  type Modal,
} from './ui.store'
export {
  useClientsStore,
  type ClientsState,
  type Client,
  type ClientFilter,
} from './clients.store'
export {
  useProgramsStore,
  type ProgramsState,
  type Program,
  type Schedule,
  type Episode,
  type ProgramFilter,
} from './programs.store'

export {
  useSubscriptionPlansStore,
  useSubscriptionPlans,
  type SubscriptionPlan,
} from './subscription-plans.store'

export {
  useDashboardStore,
  useDashboard,
  type DashboardMetrics,
  type DashboardStats,
} from './dashboard.store'

export { useOrganization } from './organization.store'
