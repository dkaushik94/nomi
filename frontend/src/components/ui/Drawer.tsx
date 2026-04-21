import type { ReactNode } from 'react'
import { Sheet } from './Sheet'
import { Modal } from './Modal'
import { useIsDesktop } from '@/hooks/useIsDesktop'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
}

export function Drawer({ open, onClose, children, className }: Props) {
  const isDesktop = useIsDesktop()
  if (isDesktop) {
    return <Modal open={open} onClose={onClose} className={className}>{children}</Modal>
  }
  return <Sheet open={open} onClose={onClose} className={className}>{children}</Sheet>
}
