import { cn } from '@/utils/cn'
import React from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
}

export function Card({ title, subtitle, children, className, headerAction }: CardProps) {
  return (
    <div className={cn('bg-white rounded-lg border border-cq-border shadow-sm', className)}>
      {(title || subtitle) && (
        <div className="px-6 py-4 border-b border-cq-border flex items-start justify-between">
          <div>
            {title && <h3 className="text-base font-semibold text-cq-text">{title}</h3>}
            {subtitle && <p className="text-sm text-cq-muted mt-0.5">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className="p-6">{children}</div>
    </div>
  )
}
