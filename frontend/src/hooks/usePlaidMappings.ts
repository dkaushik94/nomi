import { useCallback, useEffect, useState } from 'react'
import { getPlaidMappings, upsertPlaidMapping, deletePlaidMapping } from '@/services/api'
import type { PlaidMapping } from '@/types'

export function usePlaidMappings() {
  const [mappings, setMappings] = useState<PlaidMapping[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getPlaidMappings()
      setMappings(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const assign = useCallback(async (plaidCategory: string, customCategoryId: number) => {
    const mapping = await upsertPlaidMapping(plaidCategory, customCategoryId)
    setMappings((prev) => {
      // Replace any existing mapping for this plaid category, then add new one
      const filtered = prev.filter((m) => m.plaid_category !== plaidCategory)
      return [...filtered, mapping]
    })
  }, [])

  const unassign = useCallback(async (plaidCategory: string) => {
    await deletePlaidMapping(plaidCategory)
    setMappings((prev) => prev.filter((m) => m.plaid_category !== plaidCategory))
  }, [])

  return { mappings, loading, assign, unassign, refetch: fetch }
}
