import axios from 'axios'
import type { Category, CategoryCreate, PlaidMapping, SyncResult, Transaction, User, WaitlistEntry } from '@/types'

// window.__env is injected at container start (scripts/generate-env.js) for Railway.
// import.meta.env.VITE_API_URL is the fallback for local dev (Vite proxy handles /api).
const apiUrl = window.__env?.VITE_API_URL || import.meta.env.VITE_API_URL || ''
const baseURL = apiUrl ? `${apiUrl}/api/v1` : '/api/v1'

const api = axios.create({ baseURL })

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dobby_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Return user-facing error messages only
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail ?? 'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)

// Auth
export const exchangeGoogleToken = async (payload: {
  supabase_uid: string
  email: string
  access_token: string
}): Promise<string> => {
  const res = await api.post<{ access_token: string }>('/auth/google', payload)
  return res.data.access_token
}

// User
export const getProfile = async (): Promise<User> => {
  const res = await api.get<User>('/users/profile')
  return res.data
}

export const getLinkToken = async (): Promise<string> => {
  const res = await api.post<{ link_token: string }>('/users/link-token')
  return res.data.link_token
}

export const linkAccount = async (publicToken: string): Promise<User> => {
  const res = await api.post<User>('/users/link-account', { public_token: publicToken })
  return res.data
}

export const syncTransactions = async (): Promise<SyncResult> => {
  const res = await api.post<SyncResult>('/users/sync-transactions')
  return res.data
}

export const deleteAccount = async (): Promise<void> => {
  await api.delete('/users/account')
}

// Transactions
export const getTransactions = async (params?: {
  start_date?: string
  end_date?: string
  limit?: number
  offset?: number
}): Promise<Transaction[]> => {
  const res = await api.get<Transaction[]>('/transactions', { params })
  return res.data
}

export const tagTransactionCategory = async (
  transactionId: number,
  categoryId: number,
): Promise<Transaction> => {
  const res = await api.post<Transaction>(`/transactions/${transactionId}/category`, {
    category_id: categoryId,
  })
  return res.data
}

export const clearTransactionCategory = async (transactionId: number): Promise<void> => {
  await api.delete(`/transactions/${transactionId}/category`)
}

export const deleteTransaction = async (transactionId: number): Promise<void> => {
  await api.delete(`/transactions/${transactionId}`)
}

// Categories
export const getCategories = async (): Promise<Category[]> => {
  const res = await api.get<Category[]>('/categories')
  return res.data
}

export const createCategory = async (data: CategoryCreate): Promise<Category> => {
  const res = await api.post<Category>('/categories', data)
  return res.data
}

export const updateCategory = async (
  id: number,
  data: Partial<CategoryCreate>,
): Promise<Category> => {
  const res = await api.put<Category>(`/categories/${id}`, data)
  return res.data
}

export const deleteCategory = async (id: number): Promise<void> => {
  await api.delete(`/categories/${id}`)
}

// Plaid mappings
export const getPlaidMappings = async (): Promise<PlaidMapping[]> => {
  const res = await api.get<PlaidMapping[]>('/plaid-mappings')
  return res.data
}

export const upsertPlaidMapping = async (
  plaidCategory: string,
  customCategoryId: number,
): Promise<PlaidMapping> => {
  const res = await api.post<PlaidMapping>('/plaid-mappings', {
    plaid_category: plaidCategory,
    custom_category_id: customCategoryId,
  })
  return res.data
}

export const deletePlaidMapping = async (plaidCategory: string): Promise<void> => {
  await api.delete(`/plaid-mappings/${encodeURIComponent(plaidCategory)}`)
}

// Admin
export const getWaitlist = async (): Promise<WaitlistEntry[]> => {
  const res = await api.get<WaitlistEntry[]>('/admin/waitlist')
  return res.data
}

export const approveUser = async (userId: number): Promise<void> => {
  await api.post(`/admin/approve/${userId}`)
}

export const purgeUser = async (userId: number): Promise<void> => {
  await api.delete(`/admin/purge/${userId}`)
}
