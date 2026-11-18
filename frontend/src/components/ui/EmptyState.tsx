import { ReactNode } from 'react'
import { cn } from '@/utils/cn'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      {icon && (
        <div className="w-14 h-14 rounded-full bg-cq-surface border border-cq-border flex items-center justify-center mb-4 text-cq-muted">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-cq-text">{title}</p>
      {description && <p className="text-sm text-cq-muted mt-1 max-w-xs">{description}</p>}
      {action && (
        <Button size="sm" className="mt-4" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
