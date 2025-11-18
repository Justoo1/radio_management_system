/**
 * Settings Card Component
 * Reusable card wrapper for settings sections
 */

interface SettingsCardProps {
  children: React.ReactNode
  className?: string
}

export function SettingsCard({ children, className = '' }: SettingsCardProps) {
  return (
    <div className={`group relative ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/20 to-purple-600/20 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:border-indigo-500/50 transition-all duration-300 p-8 space-y-6">
        {children}
      </div>
    </div>
  )
}
