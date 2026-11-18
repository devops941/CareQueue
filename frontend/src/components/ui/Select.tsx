import { cn } from '@/utils/cn'
import React, { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-cq-text">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'block w-full rounded-md border px-3 py-2 text-sm text-cq-text appearance-none pr-8',
              'focus:outline-none focus:ring-2 focus:ring-cq-primary focus:border-transparent',
              'disabled:bg-cq-surface disabled:cursor-not-allowed',
              error ? 'border-cq-danger' : 'border-cq-border',
              className,
            )}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cq-muted pointer-events-none" />
        </div>
        {error && <p className="text-xs text-cq-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-cq-muted">{hint}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
