import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-cq-border border-t-cq-primary',
        sizes[size],
        className,
      )}
    />
  )
}

export function PageLoader() {
  return (
    <div className="min-h-screen bg-cq-surface flex items-center justify-center">
      <div className="text-center space-y-3">
        <LoadingSpinner size="lg" className="mx-auto" />
        <p className="text-sm text-cq-muted">Loading CareQueue...</p>
      </div>
    </div>
  )
}
