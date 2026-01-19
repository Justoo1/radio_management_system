/**
 * Dashboard Store (Zustand)
 * Caches dashboard metrics to reduce API calls
 * Short TTL since metrics change more frequently
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Cache TTL: 2 minutes for metrics
const CACHE_TTL = 2 * 60 * 1000

export interface DashboardMetrics {
  // Client metrics
  totalClients: number
  activeClients: number
  newClientsThisMonth: number

  // Program metrics
  totalPrograms: number
  activePrograms: number
  scheduledToday: number

  // Financial metrics
  totalRevenue: number
  revenueThisMonth: number
  pendingInvoices: number
  overdueInvoices: number

  // SMS metrics
  smsCreditsUsed: number
  smsCreditsRemaining: number
  smsCampaignsSent: number

  // Storage metrics
  storageUsed: number
  storageLimit: number
}

export interface DashboardStats {
  revenue: {
    total: number
    thisMonth: number
    lastMonth: number
    growth: number
  }
  clients: {
    total: number
    active: number
    new: number
  }
  programs: {
    total: number
    active: number
  }
  sms: {
    sent: number
    remaining: number
  }
}

interface DashboardState {
  metrics: DashboardMetrics | null
  stats: DashboardStats | null
  lastMetricsFetch: number | null
  lastStatsFetch: number | null
  isLoading: boolean
  error: string | null

  // Actions
  setMetrics: (metrics: DashboardMetrics) => void
  setStats: (stats: DashboardStats) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void

  // Cache management
  isMetricsStale: () => boolean
  isStatsStale: () => boolean
  markMetricsFetched: () => void
  markStatsFetched: () => void
  invalidateAll: () => void

  // Data fetching
  fetchMetrics: () => Promise<void>
  fetchStats: () => Promise<void>
  refreshIfStale: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set, get) => ({
      metrics: null,
      stats: null,
      lastMetricsFetch: null,
      lastStatsFetch: null,
      isLoading: false,
      error: null,

      setMetrics: (metrics) =>
        set({ metrics, error: null }),

      setStats: (stats) =>
        set({ stats, error: null }),

      setLoading: (isLoading) =>
        set({ isLoading }),

      setError: (error) =>
        set({ error }),

      isMetricsStale: () => {
        const { lastMetricsFetch } = get()
        if (!lastMetricsFetch) return true
        return Date.now() - lastMetricsFetch > CACHE_TTL
      },

      isStatsStale: () => {
        const { lastStatsFetch } = get()
        if (!lastStatsFetch) return true
        return Date.now() - lastStatsFetch > CACHE_TTL
      },

      markMetricsFetched: () =>
        set({ lastMetricsFetch: Date.now() }),

      markStatsFetched: () =>
        set({ lastStatsFetch: Date.now() }),

      invalidateAll: () =>
        set({
          lastMetricsFetch: null,
          lastStatsFetch: null,
        }),

      fetchMetrics: async () => {
        const { isLoading, isMetricsStale, metrics } = get()

        if (isLoading) return
        if (!isMetricsStale() && metrics) return

        set({ isLoading: true })

        try {
          const response = await fetch('/api/dashboard/metrics')
          if (!response.ok) throw new Error('Failed to fetch metrics')

          const data = await response.json()
          if (data.success && data.data) {
            set({ metrics: data.data, error: null })
            get().markMetricsFetched()
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },

      fetchStats: async () => {
        const { isLoading, isStatsStale, stats } = get()

        if (isLoading) return
        if (!isStatsStale() && stats) return

        set({ isLoading: true })

        try {
          const response = await fetch('/api/dashboard/stats')
          if (!response.ok) throw new Error('Failed to fetch stats')

          const data = await response.json()
          if (data.success && data.data) {
            set({ stats: data.data, error: null })
            get().markStatsFetched()
          }
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'Unknown error' })
        } finally {
          set({ isLoading: false })
        }
      },

      refreshIfStale: async () => {
        const { isMetricsStale, isStatsStale, fetchMetrics, fetchStats } = get()
        const promises: Promise<void>[] = []

        if (isMetricsStale()) promises.push(fetchMetrics())
        if (isStatsStale()) promises.push(fetchStats())

        if (promises.length > 0) {
          await Promise.all(promises)
        }
      },
    }),
    {
      name: 'dashboard-store',
      partialize: (state) => ({
        metrics: state.metrics,
        stats: state.stats,
        lastMetricsFetch: state.lastMetricsFetch,
        lastStatsFetch: state.lastStatsFetch,
      }),
    }
  )
)

// Hook for easy access with auto-refresh
export function useDashboard() {
  const store = useDashboardStore()

  if (typeof window !== 'undefined') {
    store.refreshIfStale()
  }

  return store
}
