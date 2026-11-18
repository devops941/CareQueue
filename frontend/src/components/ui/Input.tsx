import { cn } from '@/utils/cn'
import React, { forwardRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-cq-text">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm text-cq-text',
            'placeholder:text-cq-muted',
            'focus:outline-none focus:ring-2 focus:ring-cq-primary focus:border-transparent',
            'disabled:bg-cq-surface disabled:cursor-not-allowed',
            error ? 'border-cq-danger focus:ring-cq-danger' : 'border-cq-border',
            className,
          )}
          {...props}
        />
        {error && <p className="text-xs text-cq-danger">{error}</p>}
        {hint && !error && <p className="text-xs text-cq-muted">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
