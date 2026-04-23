import { useEffect, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Sheet({ open, onClose, children, className }: Props) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[500] animate-fade-in">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute bottom-0 left-1/2 w-full max-w-[430px] bg-bg rounded-t-2xl flex flex-col overflow-hidden animate-slide-up',
          'max-h-[88dvh]',
          className,
        )}
        style={{ boxShadow: '0 -4px 40px rgba(0,0,0,0.18)' }}
      >
        <div className="flex justify-center pt-3 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-faint" />
        </div>
        <div className="flex-1 overflow-y-auto pb-[calc(env(safe-area-inset-bottom,16px)+16px)]">
          {children}
        </div>
      </div>
    </div>
  )
}
