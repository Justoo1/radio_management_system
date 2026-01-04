/**
 * Organization Store (Zustand)
 * Manages organization state and subscription data
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

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
  maxClients: number
  maxSMSPerMonth: number
  maxStorageGB: number
  enabledFeatures?: string
  createdAt?: Date
}

export interface SubscriptionPlan {
  id: string
  name: string
  price: number
  currency?: string
}

export interface Subscription {
  id: string
  status: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  planId: string
  planName: string
  plan?: SubscriptionPlan
  trialEndDate?: Date
  startDate?: Date
  endDate?: Date
  renewalDate?: Date
  price?: number
  currency?: string
}

export interface OrganizationState {
  organization: Organization | null
  subscription: Subscription | null
  isLoading: boolean
  error: string | null

  // Actions
  setOrganization: (org: Organization | null) => void
  setSubscription: (sub: Subscription | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  updateOrganization: (data: Partial<Organization>) => void
}

export const useOrganizationStore = create<OrganizationState>()(
  persist(
    (set) => ({
      organization: null,
      subscription: null,
      isLoading: false,
      error: null,

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

      setLoading: (isLoading) =>
        set({
          isLoading,
        }),

      setError: (error) =>
        set({
          error,
        }),

      clearError: () =>
        set({
          error: null,
        }),

      updateOrganization: (data) =>
        set((state) => ({
          organization: state.organization
            ? { ...state.organization, ...data }
            : null,
        })),
    }),
    {
      name: 'organization-store',
      partialize: (state) => ({
        organization: state.organization,
        subscription: state.subscription,
      }),
    }
  )
)
