import { cn } from '@/lib/utils'

interface Props { size?: number; className?: string }

export function NomiLogo({ size = 40, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={cn(className)}>
      <rect width="64" height="64" rx="16" fill="#6B5FD4" />
      <path
        d="M 15 50 L 15 23 C 15 12 49 12 49 23 L 49 50"
        stroke="#EEEEE9"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}
