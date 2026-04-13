import { useCallback, useState } from 'react'
import type { Transaction } from '@/types'

const DISMISSED_KEY = 'dobby_dismissed_txns'
const NEW_WINDOW_MS = 24 * 60 * 60 * 1000 // 24 hours

function loadDismissed(): Set<number> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY)
    return raw ? new Set(JSON.parse(raw) as number[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(s: Set<number>) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify([...s]))
}

/**
 * Tracks which transactions are "new" (recently synced and unseen by the user).
 *
 * A transaction is considered new when:
 *  - Its created_at is within the last 24 hours, AND
 *  - The user has not yet dismissed it (by tagging a category or clicking "Looks good")
 *
 * Dismissed IDs are persisted in localStorage so they survive page reloads.
 */
export function useNewTransactions() {
  const [dismissed, setDismissed] = useState<Set<number>>(loadDismissed)

  const dismiss = useCallback((id: number) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(id)
      saveDismissed(next)
      return next
    })
  }, [])

  const isNew = useCallback(
    (tx: Transaction): boolean => {
      if (dismissed.has(tx.id)) return false
      const age = Date.now() - new Date(tx.created_at).getTime()
      return age < NEW_WINDOW_MS
    },
    [dismissed],
  )

  return { isNew, dismiss }
}
