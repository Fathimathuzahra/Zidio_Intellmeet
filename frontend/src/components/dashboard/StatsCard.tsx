import { TrendingUp } from 'lucide-react'
import { cn } from '../../lib/utils'

interface StatsCardProps {
  label: string
  value: string
  detail: string
  icon: React.ReactNode
  className?: string
}

export function StatsCard({ label, value, detail, icon, className }: StatsCardProps) {
  return (
    <div className={cn("card-base p-5 card-hover group", className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-colors group-hover:scale-110 duration-200">
          {icon}
        </div>
        <TrendingUp size={14} className="text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
      </div>
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</p>
      <h3 className="text-2xl font-bold text-foreground mt-1 tracking-tight tabular-nums">{value}</h3>
      <p className="text-xs text-primary font-medium mt-1.5">{detail}</p>
    </div>
  )
}
