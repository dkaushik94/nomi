import { cn } from '@/lib/utils'

interface Props {
  label: string
  color: string
  size?: 'sm' | 'md'
  className?: string
}

export function Pill({ label, color, size = 'md', className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap flex-shrink-0 leading-relaxed',
        size === 'sm' ? 'text-[10px] px-1.5 py-0.5' : 'text-[11px] px-2 py-0.5',
        className,
      )}
      style={{
        background: `${color}18`,
        border: `1px solid ${color}38`,
        color,
      }}
    >
      <span
        className="rounded-sm flex-shrink-0"
        style={{ width: size === 'sm' ? 4 : 5, height: size === 'sm' ? 4 : 5, background: color, borderRadius: '50%' }}
      />
      {label}
    </span>
  )
}
