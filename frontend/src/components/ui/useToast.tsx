import { useCallback, useState } from 'react'
import { Toast } from './Toast'

export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  // useCallback gives show a stable reference so hooks that list it as a dep don't loop
  const show = useCallback((m: string) => setMsg(m), [])
  const node = msg ? <Toast message={msg} onDone={() => setMsg(null)} /> : null
  return { show, node }
}
