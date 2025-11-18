/**
 * Form Input Component
 * Reusable input field for settings forms
 */

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export function FormInput({ label, error, ...props }: FormInputProps) {
  return (
    <div>
      <label htmlFor={props.id} className="block text-sm font-medium text-slate-300 mb-2">
        {label}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-white placeholder-slate-500 backdrop-blur transition-all duration-300 hover:border-white/30 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
    </div>
  )
}
