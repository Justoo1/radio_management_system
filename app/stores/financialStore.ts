'use client'

import { create } from 'zustand'

// Types
export interface FinancialSummary {
  period: { startDate: string; endDate: string }
  revenue: { invoices: number; total: number }
  expenses: { total: number }
  profit: { gross: number; net: number }
  paymentStatus: { paid: number; pending: number; overdue: number }
  metrics: {
    revenueGrowth: number
    collectionRate: number
    profitMargin: number
    invoiceCount: number
    averageInvoiceValue: number
    daysSalesOutstanding: number
  }
}

export interface PLReport {
  period: { startDate: string; endDate: string }
  revenue: { invoices: number; total: number }
  expenses: {
    total: number
    cogs?: number
    salary?: number
    rent?: number
    marketing?: number
    equipment?: number
    software?: number
  }
  profit: { gross: number; net: number }
  margins: { gross: number; operating: number; net: number }
  breakdown: Array<{
    date: string
    revenue: number
    expenses: number
    profit: number
  }>
}

export interface RevenueReport {
  period: { startDate: string; endDate: string }
  groupBy: string
  totalRevenue: number
  invoiceCount: number
  averageInvoiceValue: number
  topClients: Array<{
    clientName: string
    revenue: number
    invoiceCount: number
    averageInvoiceValue: number
    percentOfTotal: number
  }>
  bySource: Array<{
    source: string
    amount: number
    invoiceCount: number
    percentage: number
    growth: number
  }>
  trend: Array<{
    date: string
    revenue: number
    cumulativeRevenue: number
  }>
}

export interface AgingReport {
  asOfDate: string
  current: AgingBucket
  days30: AgingBucket
  days60: AgingBucket
  days90: AgingBucket
  over90: AgingBucket
  total: { count: number; amount: number }
  metrics: {
    dso: number
    avgDaysOverdue: number
    highestRisk: number
  }
}

export interface AgingBucket {
  label: string
  count: number
  amount: number
  percentage: number
  invoices: Array<{
    invoiceNumber: string
    clientName: string
    clientEmail?: string
    amount: number
    outstanding: number
    daysOverdue: number
    dueDate: string
    status: string
  }>
}

export interface ContractAnalysis {
  summary: {
    totalValue: number
    activeCount: number
    invoicedValue: number
    remainingValue: number
    statusBreakdown: Record<string, { count: number; value: number }>
  }
  contracts: Array<{
    id: string
    clientName: string
    totalValue: number
    status: string
    invoicedAmount: number
    remainingAmount: number
    invoiceCount: number
  }>
}

// Store State
interface FinancialState {
  // Financial Summary
  summary: FinancialSummary | null
  summaryLoading: boolean
  summaryError: string | null

  // P&L Report
  plReport: PLReport | null
  plLoading: boolean
  plError: string | null

  // Revenue Report
  revenueReport: RevenueReport | null
  revenueLoading: boolean
  revenueError: string | null
  revenueGroupBy: string

  // Aging Report
  agingReport: AgingReport | null
  agingLoading: boolean
  agingError: string | null

  // Contract Analysis
  contractAnalysis: ContractAnalysis | null
  contractLoading: boolean
  contractError: string | null

  // Actions
  setSummary: (summary: FinancialSummary | null, error?: string | null) => void
  setSummaryLoading: (loading: boolean) => void

  setPLReport: (report: PLReport | null, error?: string | null) => void
  setPLLoading: (loading: boolean) => void

  setRevenueReport: (report: RevenueReport | null, error?: string | null) => void
  setRevenueLoading: (loading: boolean) => void
  setRevenueGroupBy: (groupBy: string) => void

  setAgingReport: (report: AgingReport | null, error?: string | null) => void
  setAgingLoading: (loading: boolean) => void

  setContractAnalysis: (analysis: ContractAnalysis | null, error?: string | null) => void
  setContractLoading: (loading: boolean) => void

  // Clear store
  clearStore: () => void
}

// Zustand Store
export const useFinancialStore = create<FinancialState>((set) => ({
  // Financial Summary
  summary: null,
  summaryLoading: false,
  summaryError: null,

  // P&L Report
  plReport: null,
  plLoading: false,
  plError: null,

  // Revenue Report
  revenueReport: null,
  revenueLoading: false,
  revenueError: null,
  revenueGroupBy: 'client',

  // Aging Report
  agingReport: null,
  agingLoading: false,
  agingError: null,

  // Contract Analysis
  contractAnalysis: null,
  contractLoading: false,
  contractError: null,

  // Actions
  setSummary: (summary, error = null) =>
    set({ summary, summaryError: error }),

  setSummaryLoading: (loading) =>
    set({ summaryLoading: loading }),

  setPLReport: (report, error = null) =>
    set({ plReport: report, plError: error }),

  setPLLoading: (loading) =>
    set({ plLoading: loading }),

  setRevenueReport: (report, error = null) =>
    set({ revenueReport: report, revenueError: error }),

  setRevenueLoading: (loading) =>
    set({ revenueLoading: loading }),

  setRevenueGroupBy: (groupBy) =>
    set({ revenueGroupBy: groupBy }),

  setAgingReport: (report, error = null) =>
    set({ agingReport: report, agingError: error }),

  setAgingLoading: (loading) =>
    set({ agingLoading: loading }),

  setContractAnalysis: (analysis, error = null) =>
    set({ contractAnalysis: analysis, contractError: error }),

  setContractLoading: (loading) =>
    set({ contractLoading: loading }),

  clearStore: () =>
    set({
      summary: null,
      summaryError: null,
      plReport: null,
      plError: null,
      revenueReport: null,
      revenueError: null,
      agingReport: null,
      agingError: null,
      contractAnalysis: null,
      contractError: null,
    }),
}))
