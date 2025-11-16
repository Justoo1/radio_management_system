/**
 * Authentication Types
 */

export interface User {
  id: string
  email: string
  name?: string
  organizationId: string
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'USER'
}

export interface AuthSession {
  user: {
    id: string
    email: string
    name: string
    organizationId: string
    role: string
    image?: string
  }
  expires: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  organizationName: string
  email: string
  password: string
  confirmPassword: string
  name?: string
  phone?: string
  country?: string
}

export interface AuthError {
  message: string
  code?: string
}

export interface PasswordResetRequest {
  email: string
}

export interface PasswordReset {
  token: string
  password: string
  confirmPassword: string
}
