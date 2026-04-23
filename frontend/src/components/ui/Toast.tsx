import { useEffect, useState } from 'react'

interface Props { message: string; onDone: () => void }

export function Toast({ message, onDone }: Props) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 300) }, 2500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div
      className="fixed bottom-[calc(64px+env(safe-area-inset-bottom,0px)+16px)] md:bottom-6 left-1/2 -translate-x-1/2 z-[1000] px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap"
      style={{
        background: 'var(--ink)', color: 'var(--bg)',
        boxShadow: 'var(--shadow-lg)',
        opacity: visible ? 1 : 0,
        transform: `translateX(-50%) translateY(${visible ? 0 : 8}px)`,
        transition: 'opacity 0.3s, transform 0.3s',
      }}
    >
      {message}
    </div>
  )
}

