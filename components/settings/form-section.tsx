/**
 * Form Section Component
 * Reusable wrapper for settings form sections
 */

interface FormSectionProps {
  title: string
  description?: string
  children: React.ReactNode
}

export function FormSection({ title, description, children }: FormSectionProps) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-sm text-slate-400 mb-4">{description}</p>}
      {children}
    </div>
  )
}
