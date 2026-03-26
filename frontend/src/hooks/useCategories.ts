import { useCallback, useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '@/services/api'
import type { Category, CategoryCreate } from '@/types'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategories()
      setCategories(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const create = useCallback(async (data: CategoryCreate) => {
    const cat = await createCategory(data)
    setCategories((prev) => [...prev, cat].sort((a, b) => a.label.localeCompare(b.label)))
    return cat
  }, [])

  const update = useCallback(async (id: number, data: Partial<CategoryCreate>) => {
    const cat = await updateCategory(id, data)
    setCategories((prev) => prev.map((c) => (c.id === id ? cat : c)))
    return cat
  }, [])

  const remove = useCallback(async (id: number) => {
    await deleteCategory(id)
    setCategories((prev) => prev.filter((c) => c.id !== id))
  }, [])

  return { categories, loading, error, refetch: fetch, create, update, remove }
}
