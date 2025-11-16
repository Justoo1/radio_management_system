/**
 * UI Store (Zustand)
 * Manages UI state like modals, notifications, and global loading
 */

import { create } from 'zustand'

export interface Toast {
  id: string
  title?: string
  description?: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

export interface Modal {
  id: string
  isOpen: boolean
  title?: string
  data?: any
}

export interface UIState {
  // Toast notifications
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void

  // Modal management
  modals: Record<string, Modal>
  openModal: (id: string, data?: any) => void
  closeModal: (id: string) => void
  isModalOpen: (id: string) => boolean

  // Global loading
  isLoading: boolean
  setIsLoading: (loading: boolean) => void

  // Sidebar state
  isSidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  // Toast
  toasts: [],

  addToast: (toast) => {
    const id = `${Date.now()}-${Math.random()}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))

    // Auto-remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      get().removeToast(id)
    }, duration)
  },

  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  clearToasts: () =>
    set({
      toasts: [],
    }),

  // Modals
  modals: {},

  openModal: (id, data) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: {
          id,
          isOpen: true,
          data,
        },
      },
    })),

  closeModal: (id) =>
    set((state) => ({
      modals: {
        ...state.modals,
        [id]: {
          ...state.modals[id],
          isOpen: false,
        },
      },
    })),

  isModalOpen: (id) => {
    const state = get()
    return state.modals[id]?.isOpen ?? false
  },

  // Global loading
  isLoading: false,

  setIsLoading: (isLoading) =>
    set({
      isLoading,
    }),

  // Sidebar
  isSidebarOpen: true,

  toggleSidebar: () =>
    set((state) => ({
      isSidebarOpen: !state.isSidebarOpen,
    })),

  setSidebarOpen: (open) =>
    set({
      isSidebarOpen: open,
    }),
}))
