import { cn } from '@/utils/cn'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

type Trend = 'up' | 'down' | 'flat'

interface KPICardProps {
  title: string
  value: string | number
  unit?: string
  trend?: Trend
  trendValue?: string
  trendPositive?: boolean
  subtitle?: string
  className?: string
  source?: 'historical' | 'simulation'
}

export function KPICard({
  title,
  value,
  unit,
  trend,
  trendValue,
  trendPositive,
  subtitle,
  className,
  source,
}: KPICardProps) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor =
    trendPositive === undefined
      ? 'text-cq-muted'
      : trendPositive
      ? 'text-cq-accent'
      : 'text-cq-danger'

  return (
    <div className={cn('bg-white rounded-lg border border-cq-border shadow-sm p-5', className)}>
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-cq-muted">{title}</p>
        {source && (
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              source === 'historical'
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-orange-100 text-orange-700',
            )}
          >
            {source === 'historical' ? 'Historical' : 'Simulation'}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-3xl font-bold text-cq-text">{value}</span>
        {unit && <span className="text-sm text-cq-muted">{unit}</span>}
      </div>
      {(trend || subtitle) && (
        <div className="mt-2 flex items-center gap-1">
          {trend && (
            <>
              <TrendIcon className={cn('w-3.5 h-3.5', trendColor)} />
              {trendValue && <span className={cn('text-xs font-medium', trendColor)}>{trendValue}</span>}
            </>
          )}
          {subtitle && <span className="text-xs text-cq-muted">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}
