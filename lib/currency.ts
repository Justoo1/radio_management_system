/**
 * Currency formatting utilities
 * Handles multi-currency support for organizations
 */

export interface CurrencyConfig {
  code: string // ISO 4217 currency code
  symbol: string
  name: string
  decimals: number
  locale?: string
}

// Supported currencies
export const CURRENCIES: Record<string, CurrencyConfig> = {
  GHS: {
    code: 'GHS',
    symbol: '₵',
    name: 'Ghana Cedi',
    decimals: 2,
    locale: 'en-GH',
  },
  USD: {
    code: 'USD',
    symbol: '$',
    name: 'US Dollar',
    decimals: 2,
    locale: 'en-US',
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    name: 'Euro',
    decimals: 2,
    locale: 'en-EU',
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    name: 'British Pound',
    decimals: 2,
    locale: 'en-GB',
  },
  NGN: {
    code: 'NGN',
    symbol: '₦',
    name: 'Nigerian Naira',
    decimals: 2,
    locale: 'en-NG',
  },
  ZAR: {
    code: 'ZAR',
    symbol: 'R',
    name: 'South African Rand',
    decimals: 2,
    locale: 'en-ZA',
  },
  KES: {
    code: 'KES',
    symbol: 'KSh',
    name: 'Kenyan Shilling',
    decimals: 2,
    locale: 'en-KE',
  },
}

/**
 * Get currency configuration by code
 */
export function getCurrencyConfig(code: string): CurrencyConfig {
  return CURRENCIES[code] || CURRENCIES.GHS // Default to GHS
}

/**
 * Format amount with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'GHS',
  options?: {
    showSymbol?: boolean
    showCode?: boolean
    decimals?: number
    forPDF?: boolean // Use for PDF export to avoid Unicode issues
  }
): string {
  const config = getCurrencyConfig(currencyCode)
  const decimals = options?.decimals ?? config.decimals
  const showSymbol = options?.showSymbol ?? true
  const showCode = options?.showCode ?? false
  const forPDF = options?.forPDF ?? false

  // Format the number with proper locale
  const formatted = new Intl.NumberFormat(config.locale || 'en-GH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount)

  // Build the final string
  let result = ''

  if (forPDF) {
    // For PDF, use currency code instead of symbol to avoid Unicode issues
    result = `${config.code} ${formatted}`
  } else {
    if (showSymbol) {
      result = `${config.symbol}${formatted}`
    } else {
      result = formatted
    }

    if (showCode) {
      result = `${result} ${config.code}`
    }
  }

  return result
}

/**
 * Format currency for display in compact form (e.g., "₵1.5K")
 */
export function formatCurrencyCompact(
  amount: number,
  currencyCode: string = 'GHS'
): string {
  const config = getCurrencyConfig(currencyCode)
  const absAmount = Math.abs(amount)

  let value: number
  let suffix: string

  if (absAmount >= 1_000_000) {
    value = amount / 1_000_000
    suffix = 'M'
  } else if (absAmount >= 1_000) {
    value = amount / 1_000
    suffix = 'K'
  } else {
    return formatCurrency(amount, currencyCode)
  }

  return `${config.symbol}${value.toFixed(1)}${suffix}`
}

/**
 * Get currency symbol by code
 */
export function getCurrencySymbol(currencyCode: string = 'GHS'): string {
  return getCurrencyConfig(currencyCode).symbol
}

/**
 * Parse currency string to number (removes symbols and formatting)
 */
export function parseCurrency(value: string): number {
  // Remove all non-numeric characters except decimal point and minus sign
  const cleaned = value.replace(/[^\d.-]/g, '')
  return parseFloat(cleaned) || 0
}

/**
 * List of all available currencies
 */
export function getAvailableCurrencies(): CurrencyConfig[] {
  return Object.values(CURRENCIES)
}
