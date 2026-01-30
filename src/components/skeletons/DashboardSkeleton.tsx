'use client'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  style?: React.CSSProperties
}

/**
 * Base Skeleton component with pulse animation
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      className={cn('skeleton', className)}
      style={style}
      aria-hidden="true"
      role="presentation"
    />
  )
}

/**
 * Skeleton for metric cards
 */
export function CardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton-card', className)}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
        <Skeleton className="h-10 w-10 rounded-xl" />
      </div>
    </div>
  )
}

/**
 * Skeleton for chart components
 */
export function ChartSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton-card min-h-[300px]', className)}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="flex items-end gap-2 h-[200px] pt-4">
          {[...Array(12)].map((_, i) => (
            <Skeleton
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${Math.random() * 60 + 40}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
        <div className="flex justify-between pt-2">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-3 w-12" />
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Skeleton for table rows
 */
export function TableSkeleton({ rows = 5, className }: SkeletonProps & { rows?: number }) {
  return (
    <div className={cn('skeleton-card', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex gap-4 pb-2 border-b border-border/50">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16 ml-auto" />
        </div>
        {/* Rows */}
        {[...Array(rows)].map((_, i) => (
          <div
            key={i}
            className="flex gap-4 items-center"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Skeleton for the hero metric card
 */
export function HeroCardSkeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('skeleton-card p-6', className)}>
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-12 w-48" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="h-16 w-16 rounded-2xl" />
      </div>
    </div>
  )
}

/**
 * Full dashboard skeleton for initial loading state
 */
export function DashboardSkeleton() {
  return (
    <div
      className="space-y-6 animate-in fade-in duration-300"
      role="status"
      aria-label="Carregando dashboard"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-40 rounded-xl" />
          <Skeleton className="h-10 w-10 rounded-xl" />
        </div>
      </div>

      {/* Hero Card */}
      <HeroCardSkeleton />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Additional Charts */}
      <div className="grid lg:grid-cols-3 gap-6">
        <ChartSkeleton />
        <ChartSkeleton />
        <ChartSkeleton />
      </div>

      {/* Screen reader announcement */}
      <span className="sr-only">Carregando dados do dashboard, por favor aguarde...</span>
    </div>
  )
}

export default DashboardSkeleton
