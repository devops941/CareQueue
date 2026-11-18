import { cn } from '@/utils/cn'
import React, { forwardRef } from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-cq-text">{label}</label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={3}
          className={cn(
            'block w-full rounded-md border px-3 py-2 text-sm text-cq-text resize-none',
            'placeholder:text-cq-muted',
            'focus:outline-none focus:ring-2 focus:ring-cq-primary focus:border-transparent',
            error ? 'border-cq-danger' : 'border-cq-border',
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
Textarea.displayName = 'Textarea'
