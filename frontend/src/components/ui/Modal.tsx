import * as Dialog from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, children, className }: Props) {
  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500] animate-fade-in" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[501]',
            'w-full max-w-md bg-bg rounded-2xl overflow-hidden flex flex-col',
            'max-h-[85dvh] animate-fade-in',
            className,
          )}
          style={{ boxShadow: '0 8px 60px rgba(0,0,0,0.3)' }}
          onInteractOutside={() => onClose()}
          onEscapeKeyDown={() => onClose()}
        >
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
