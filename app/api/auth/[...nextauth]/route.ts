/**
 * NextAuth.js v5 Route Handler
 * Handles all authentication endpoints
 */

import { handlers } from '@/lib/auth'

// Delegate to NextAuth handlers
export const { GET, POST } = handlers
