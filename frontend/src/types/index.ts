export interface User {
  id: number
  email: string
  is_admin: boolean
  is_active: boolean
  plaid_item_id: string | null
  institution_name: string | null
  created_at: string
}

export interface BankLink {
  id: number
  plaid_item_id: string
  institution_id: string | null
  institution_name: string | null
  is_active: boolean
  linked_at: string
  unlinked_at: string | null
}

export interface Category {
  id: number
  label: string
  value: string
  color: string
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: number
  plaid_transaction_id: string
  plaid_account_id: string
  name: string
  merchant_name: string | null
  amount: number
  currency_code: string
  transaction_date: string
  authorized_date: string | null
  plaid_category: string | null
  plaid_category_detailed: string | null
  pending: boolean
  payment_channel: string | null
  logo_url: string | null
  custom_category_id: number | null
  created_at: string
}

export interface CategoryCreate {
  label: string
  value: string
  color: string
}

export interface SyncResult {
  added: number
  modified: number
  removed: number
}

export interface WaitlistEntry {
  id: number
  email: string
  created_at: string
}

export interface PlaidMapping {
  id: number
  custom_category_id: number
  plaid_category: string
}
