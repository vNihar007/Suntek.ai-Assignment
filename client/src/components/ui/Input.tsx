import { cn } from '../../lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
}

export default function Input({ label, error, helperText, className, id, ...props }: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#94A3B8]">
          {label}
          {props.required && <span className="text-[#DC2626] ml-1" aria-hidden>*</span>}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        className={cn(
          'w-full rounded-lg px-4 py-2.5 text-sm bg-[#1E293B] text-white',
          'border border-white/10 placeholder:text-[#475569]',
          'transition-colors duration-200 outline-none min-h-[44px]',
          'focus:border-[#D97706] focus:ring-2 focus:ring-[#D97706]/20',
          error && 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20',
          className,
        )}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
      />
      {error && (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-[#DC2626]">{error}</p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-helper`} className="text-xs text-[#475569]">{helperText}</p>
      )}
    </div>
  )
}
