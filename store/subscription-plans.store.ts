/**
 * Subscription Plans Store (Zustand)
 * Caches subscription plans to avoid repeated fetches
 * Plans rarely change, so long TTL is appropriate
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cache TTL: 1 hour (plans rarely change)
const CACHE_TTL = 60 * 60 * 1000

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: string
  currency: string
  billingInterval: string
  maxUsers: number
  maxClients: number
  maxSMSPerMonth: number
  maxStorageGB: number
  maxPrograms: number
  features: string[]
  isPopular: boolean
  isActive: boolean
}

interface SubscriptionPlansState {
  plans: SubscriptionPlan[]
  lastFetched: number | null
  isLoading: boolean
  error: string | null

  // Actions
  setPlans: (plans: SubscriptionPlan[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Cache management
  isStale: () => boolean
  markFetched: () => void
  invalidate: () => void

  // Data fetching
  fetchPlans: () => Promise<SubscriptionPlan[]>
  getPlans: () => Promise<SubscriptionPlan[]>

  // Helpers
  getPlanById: (id: string) => SubscriptionPlan | undefined
  getPlanByName: (name: string) => SubscriptionPlan | undefined
}

export const useSubscriptionPlansStore = create<SubscriptionPlansState>()(
  persist(
    (set, get) => ({
      plans: [],
      lastFetched: null,
      isLoading: false,
      error: null,

      setPlans: (plans) =>
        set({ plans, error: null }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      isStale: () => {
        const { lastFetched } = get()
        if (!lastFetched) return true
        return Date.now() - lastFetched > CACHE_TTL
      },

      markFetched: () =>
        set({ lastFetched: Date.now() }),

      invalidate: () =>
        set({ lastFetched: null }),

      fetchPlans: async () => {
        const { isLoading } = get()
        if (isLoading) return get().plans

        set({ isLoading: true })

        try {
          const response = await fetch('/api/subscription/plans')
          if (!response.ok) throw new Error('Failed to fetch plans')

          const data = await response.json()
          const plans = data.data || []

          // Parse features if needed
          const parsedPlans = plans.map((plan: any) => ({
            ...plan,
            features: typeof plan.features === 'string'
              ? JSON.parse(plan.features)
              : plan.features || [],
          }))

          set({ plans: parsedPlans, error: null })
          get().markFetched()

          return parsedPlans
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error'
          set({ error: errorMsg })
          return get().plans
        } finally {
          set({ isLoading: false })
        }
      },

      getPlans: async () => {
        const { plans, isStale, fetchPlans } = get()

        // Return cached if fresh
        if (plans.length > 0 && !isStale()) {
          return plans
        }

        // Fetch fresh data
        return fetchPlans()
      },

      getPlanById: (id) => {
        return get().plans.find((p) => p.id === id)
      },

      getPlanByName: (name) => {
        return get().plans.find((p) => p.name.toLowerCase() === name.toLowerCase())
      },
    }),
    {
      name: 'subscription-plans-store',
      partialize: (state) => ({
        plans: state.plans,
        lastFetched: state.lastFetched,
      }),
    }
  )
)

// Hook for easy access
export function useSubscriptionPlans() {
  const store = useSubscriptionPlansStore()

  // Auto-fetch if stale
  if (typeof window !== 'undefined' && store.isStale()) {
    store.fetchPlans()
  }

  return store
}
