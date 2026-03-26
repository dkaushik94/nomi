import { useCallback, useEffect, useRef, useState } from 'react'
import { getTransactions, tagTransactionCategory, clearTransactionCategory, deleteTransaction } from '@/services/api'
import type { Transaction } from '@/types'

const PAGE_SIZE = 20

interface UseTransactionsOptions {
  startDate?: string
  endDate?: string
  /** When true, fetches in pages of 20. Use loadMore() to fetch the next page. */
  paginated?: boolean
}

export function useTransactions(options: UseTransactionsOptions = {}) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)
  const offsetRef = useRef(0)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    offsetRef.current = 0
    try {
      const params: Parameters<typeof getTransactions>[0] = {
        start_date: options.startDate,
        end_date: options.endDate,
      }
      if (options.paginated) {
        params.limit = PAGE_SIZE
        params.offset = 0
      }
      const data = await getTransactions(params)
      setTransactions(data)
      if (options.paginated) {
        setHasMore(data.length === PAGE_SIZE)
        offsetRef.current = data.length
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }, [options.startDate, options.endDate, options.paginated])

  useEffect(() => { fetch() }, [fetch])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return
    setLoadingMore(true)
    try {
      const data = await getTransactions({
        start_date: options.startDate,
        end_date: options.endDate,
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      })
      setTransactions((prev) => [...prev, ...data])
      setHasMore(data.length === PAGE_SIZE)
      offsetRef.current += data.length
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more transactions')
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, options.startDate, options.endDate])

  const tagCategory = useCallback(async (transactionId: number, categoryId: number) => {
    const updated = await tagTransactionCategory(transactionId, categoryId)
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
  }, [])

  const clearCategory = useCallback(async (transactionId: number) => {
    await clearTransactionCategory(transactionId)
    setTransactions((prev) => prev.map((t) => t.id === transactionId ? { ...t, custom_category_id: null } : t))
  }, [])

  const remove = useCallback(async (transactionId: number) => {
    await deleteTransaction(transactionId)
    setTransactions((prev) => prev.filter((t) => t.id !== transactionId))
  }, [])

  return { transactions, loading, loadingMore, hasMore, error, refetch: fetch, loadMore, tagCategory, clearCategory, remove }
}
