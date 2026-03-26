/** Exhaustive list of Plaid personal finance primary categories (taxonomy v2). */

export interface PlaidCategoryMeta {
  key: string          // matches plaid_category stored in DB
  label: string        // human-readable display label
  group: string        // logical grouping for the UI
}

export const PLAID_CATEGORIES: PlaidCategoryMeta[] = [
  // ── Food & Drink ──────────────────────────────────────────────────────────
  { key: 'FOOD_AND_DRINK',          label: 'Food & Drink',           group: 'Food & Drink' },

  // ── Shopping ──────────────────────────────────────────────────────────────
  { key: 'GENERAL_MERCHANDISE',     label: 'General Merchandise',    group: 'Shopping' },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { key: 'ENTERTAINMENT',           label: 'Entertainment',          group: 'Entertainment' },

  // ── Transport & Travel ────────────────────────────────────────────────────
  { key: 'TRANSPORTATION',          label: 'Transportation',         group: 'Transport & Travel' },
  { key: 'TRAVEL',                  label: 'Travel',                 group: 'Transport & Travel' },

  // ── Home ──────────────────────────────────────────────────────────────────
  { key: 'HOME_IMPROVEMENT',        label: 'Home Improvement',       group: 'Home' },
  { key: 'RENT_AND_UTILITIES',      label: 'Rent & Utilities',       group: 'Home' },

  // ── Health ────────────────────────────────────────────────────────────────
  { key: 'MEDICAL',                 label: 'Medical',                group: 'Health' },
  { key: 'PERSONAL_CARE',           label: 'Personal Care',          group: 'Health' },

  // ── Services ──────────────────────────────────────────────────────────────
  { key: 'GENERAL_SERVICES',        label: 'General Services',       group: 'Services' },
  { key: 'GOVERNMENT_AND_NON_PROFIT', label: 'Government & Non-Profit', group: 'Services' },

  // ── Income & Transfers ────────────────────────────────────────────────────
  { key: 'INCOME',                  label: 'Income',                 group: 'Income & Transfers' },
  { key: 'TRANSFER_IN',             label: 'Transfer In',            group: 'Income & Transfers' },
  { key: 'TRANSFER_OUT',            label: 'Transfer Out',           group: 'Income & Transfers' },

  // ── Debt & Fees ───────────────────────────────────────────────────────────
  { key: 'LOAN_PAYMENTS',           label: 'Loan Payments',          group: 'Debt & Fees' },
  { key: 'BANK_FEES',               label: 'Bank Fees',              group: 'Debt & Fees' },
]

/** Unique group names in display order. */
export const PLAID_CATEGORY_GROUPS = [
  'Food & Drink',
  'Shopping',
  'Entertainment',
  'Transport & Travel',
  'Home',
  'Health',
  'Services',
  'Income & Transfers',
  'Debt & Fees',
]
