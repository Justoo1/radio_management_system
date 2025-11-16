/**
 * Login Page
 * User authentication page
 */

import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center">Welcome Back</h2>
      <p className="text-center text-slate-600 mb-8">Sign in to your account to continue</p>
      <LoginForm />
    </div>
  )
}
