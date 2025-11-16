/**
 * Clients Store (Zustand)
 * Manages clients list and filters
 */

import { create } from 'zustand'

export interface Client {
  id: string
  organizationId: string
  name: string
  email: string
  phone: string
  category: string
  companyName?: string
  address?: string
  city?: string
  state?: string
  country?: string
  zipCode?: string
  notes?: string
  contactPerson?: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  createdAt: Date
  updatedAt: Date
}

export interface ClientFilter {
  search?: string
  category?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  sortBy?: 'name' | 'email' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export interface ClientsState {
  clients: Client[]
  selectedClient: Client | null
  filters: ClientFilter
  isLoading: boolean
  error: string | null
  totalCount: number
  currentPage: number
  pageSize: number

  // Actions
  setClients: (clients: Client[]) => void
  addClient: (client: Client) => void
  updateClient: (id: string, data: Partial<Client>) => void
  deleteClient: (id: string) => void
  setSelectedClient: (client: Client | null) => void
  setFilters: (filters: Partial<ClientFilter>) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  setPagination: (page: number, pageSize: number) => void
  setTotalCount: (count: number) => void
  clearError: () => void
}

export const useClientsStore = create<ClientsState>((set) => ({
  clients: [],
  selectedClient: null,
  filters: {},
  isLoading: false,
  error: null,
  totalCount: 0,
  currentPage: 1,
  pageSize: 10,

  setClients: (clients) =>
    set({
      clients,
      error: null,
    }),

  addClient: (client) =>
    set((state) => ({
      clients: [client, ...state.clients],
      totalCount: state.totalCount + 1,
    })),

  updateClient: (id, data) =>
    set((state) => ({
      clients: state.clients.map((c) =>
        c.id === id ? { ...c, ...data } : c
      ),
      selectedClient:
        state.selectedClient?.id === id
          ? { ...state.selectedClient, ...data }
          : state.selectedClient,
    })),

  deleteClient: (id) =>
    set((state) => ({
      clients: state.clients.filter((c) => c.id !== id),
      selectedClient:
        state.selectedClient?.id === id ? null : state.selectedClient,
      totalCount: state.totalCount - 1,
    })),

  setSelectedClient: (client) =>
    set({
      selectedClient: client,
    }),

  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
      currentPage: 1, // Reset to first page when filters change
    })),

  setLoading: (isLoading) =>
    set({
      isLoading,
    }),

  setError: (error) =>
    set({
      error,
    }),

  setPagination: (page, pageSize) =>
    set({
      currentPage: page,
      pageSize,
    }),

  setTotalCount: (count) =>
    set({
      totalCount: count,
    }),

  clearError: () =>
    set({
      error: null,
    }),
}))
