/**
 * Register Page
 * Organization registration page
 */

import { RegisterForm } from '@/components/auth/register-form'

export default function RegisterPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-2 text-center">Get Started</h2>
      <p className="text-center text-slate-600 mb-8">Create your radio station account to begin</p>
      <RegisterForm />
    </div>
  )
}
