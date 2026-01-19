/**
 * Organization Store (Zustand)
 * Manages organization state with caching and staleness tracking
 * Reduces API calls by caching data client-side
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cache TTL in milliseconds
const CACHE_TTL = {
  ORGANIZATION: 5 * 60 * 1000,    // 5 minutes
  SUBSCRIPTION: 5 * 60 * 1000,    // 5 minutes
  FEATURES: 5 * 60 * 1000,        // 5 minutes
  LIMITS: 2 * 60 * 1000,          // 2 minutes
}

export interface Organization {
  id: string
  name: string
  email: string
  phone?: string
  logo?: string
  description?: string
  website?: string
  country?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  status?: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'EXPIRED'
  maxUsers: number
  maxClients: number
  maxSMSPerMonth: number
  maxStorageGB: number
  maxPrograms: number
  enabledFeatures?: string
  hasPaymentAccount?: boolean
  trialEndDate?: string
  createdAt?: Date
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency?: string
  maxUsers?: number
  maxClients?: number
  maxSMSPerMonth?: number
  maxStorageGB?: number
  maxPrograms?: number
  features?: string[]
}

export interface Subscription {
  id: string
  status: 'TRIALING' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED' | 'PAST_DUE'
  planId: string
  planName: string
  plan?: SubscriptionPlan
  trialEndDate?: Date
  startDate?: Date
  endDate?: Date
  currentPeriodStart?: Date
  currentPeriodEnd?: Date
  renewalDate?: Date
  price?: number
  currency?: string
}

interface CacheMetadata {
  lastFetched: number | null
  isStale: boolean
}

export interface OrganizationState {
  // Data
  organization: Organization | null
  subscription: Subscription | null
  enabledFeatures: string[]

  // Cache metadata
  orgCache: CacheMetadata
  subCache: CacheMetadata
  featuresCache: CacheMetadata

  // Loading states
  isLoading: boolean
  isFetching: boolean
  error: string | null

  // Actions
  setOrganization: (org: Organization | null) => void
  setSubscription: (sub: Subscription | null) => void
  setEnabledFeatures: (features: string[]) => void
  setLoading: (loading: boolean) => void
  setFetching: (fetching: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  updateOrganization: (data: Partial<Organization>) => void

  // Cache management
  isOrgStale: () => boolean
  isSubStale: () => boolean
  isFeaturesStale: () => boolean
  markOrgFetched: () => void
  markSubFetched: () => void
  markFeaturesFetched: () => void
  invalidateCache: () => void
  invalidateOrgCache: () => void
  invalidateSubCache: () => void
  invalidateFeaturesCache: () => void

  // Data fetching
  fetchOrganization: () => Promise<void>
  fetchSubscription: () => Promise<void>
  fetchAll: () => Promise<void>
  refreshIfStale: () => Promise<void>

  // Helpers
  hasFeature: (feature: string) => boolean
  hasActiveSubscription: () => boolean
}

const initialCacheMetadata: CacheMetadata = {
  lastFetched: null,
  isStale: true,
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set, get) => ({
      // Initial state
      organization: null,
      subscription: null,
      enabledFeatures: [],
      orgCache: { ...initialCacheMetadata },
      subCache: { ...initialCacheMetadata },
      featuresCache: { ...initialCacheMetadata },
      isLoading: false,
      isFetching: false,
      error: null,

      // Setters
      setOrganization: (organization) =>
        set({
          organization,
          error: null,
        }),

      setSubscription: (subscription) =>
        set({
          subscription,
          error: null,
        }),

      setEnabledFeatures: (enabledFeatures) =>
        set({ enabledFeatures }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setFetching: (isFetching) =>
        set({ isFetching }),

      setError: (error) =>
        set({ error }),

      clearError: () =>
        set({ error: null }),

      updateOrganization: (data) =>
        set((state) => ({
          organization: state.organization
            ? { ...state.organization, ...data }
            : null,
        })),

      // Cache staleness checks
      isOrgStale: () => {
        const { orgCache } = get()
        if (!orgCache.lastFetched) return true
        return Date.now() - orgCache.lastFetched > CACHE_TTL.ORGANIZATION
      },

      isSubStale: () => {
        const { subCache } = get()
        if (!subCache.lastFetched) return true
        return Date.now() - subCache.lastFetched > CACHE_TTL.SUBSCRIPTION
      },

      isFeaturesStale: () => {
        const { featuresCache } = get()
        if (!featuresCache.lastFetched) return true
        return Date.now() - featuresCache.lastFetched > CACHE_TTL.FEATURES
      },

      // Mark cache as fresh
      markOrgFetched: () =>
        set({
          orgCache: { lastFetched: Date.now(), isStale: false },
        }),

      markSubFetched: () =>
        set({
          subCache: { lastFetched: Date.now(), isStale: false },
        }),

      markFeaturesFetched: () =>
        set({
          featuresCache: { lastFetched: Date.now(), isStale: false },
        }),

      // Invalidation
      invalidateCache: () =>
        set({
          orgCache: { ...initialCacheMetadata },
          subCache: { ...initialCacheMetadata },
          featuresCache: { ...initialCacheMetadata },
        }),

      invalidateOrgCache: () =>
        set({ orgCache: { ...initialCacheMetadata } }),

      invalidateSubCache: () =>
        set({ subCache: { ...initialCacheMetadata } }),

      invalidateFeaturesCache: () =>
        set({ featuresCache: { ...initialCacheMetadata } }),

      // Fetch organization data
      fetchOrganization: async () => {
        const { isFetching, isOrgStale, organization } = get()

        // Skip if already fetching or cache is fresh
        if (isFetching) return
        if (!isOrgStale() && organization) return

        set({ isFetching: true })

        try {
          const response = await fetch('/api/organization/info')
          if (!response.ok) throw new Error('Failed to fetch organization')

          const data = await response.json()
          if (data.success && data.data) {
            const org = data.data
            set({
              organization: org,
              enabledFeatures: org.enabledFeatures
                ? JSON.parse(org.enabledFeatures)
                : [],
              error: null,
            })
            get().markOrgFetched()
            get().markFeaturesFetched()
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isFetching: false })
        }
      },

      // Fetch subscription data
      fetchSubscription: async () => {
        const { isFetching, isSubStale, subscription } = get()

        if (isFetching) return
        if (!isSubStale() && subscription) return

        set({ isFetching: true })

        try {
          const response = await fetch('/api/organization/subscription')
          if (!response.ok) throw new Error('Failed to fetch subscription')

          const data = await response.json()
          if (data.success && data.data) {
            set({
              subscription: data.data,
              error: null,
            })
            get().markSubFetched()
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isFetching: false })
        }
      },

      // Fetch all data
      fetchAll: async () => {
        const { fetchOrganization, fetchSubscription } = get()
        await Promise.all([fetchOrganization(), fetchSubscription()])
      },

      // Refresh stale data
      refreshIfStale: async () => {
        const { isOrgStale, isSubStale, fetchOrganization, fetchSubscription } = get()
        const promises: Promise<void>[] = []

        if (isOrgStale()) promises.push(fetchOrganization())
        if (isSubStale()) promises.push(fetchSubscription())

        if (promises.length > 0) {
          await Promise.all(promises)
        }
      },

      // Helpers
      hasFeature: (feature: string) => {
        const { enabledFeatures } = get()
        return enabledFeatures.includes(feature)
      },

      hasActiveSubscription: () => {
        const { subscription } = get()
        return subscription?.status === 'ACTIVE'
      },
    }),
    {
      name: 'organization-store',
      partialize: (state) => ({
        organization: state.organization,
        subscription: state.subscription,
        enabledFeatures: state.enabledFeatures,
        orgCache: state.orgCache,
        subCache: state.subCache,
        featuresCache: state.featuresCache,
      }),
    }
  )
)

// Hook for auto-fetching on mount
export function useOrganization() {
  const store = useOrganizationStore()

  // Fetch data if stale on access
  if (typeof window !== 'undefined') {
    store.refreshIfStale()
  }

  return store
}
