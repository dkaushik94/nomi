import { cn } from '@/lib/utils'

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={cn('w-6 h-6 rounded-full border-[2.5px] border-faint border-t-accent animate-spin-slow', className)}
    />
  )
}
