/**
 * Toast Provider
 * Provides toast notification context using Sonner
 */

'use client'

import { Toaster } from 'sonner'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="light"
    />
  )
}
