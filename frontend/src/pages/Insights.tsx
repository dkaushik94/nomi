import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { HBar } from '@/components/ui/HBar'
import { Spinner } from '@/components/ui/Spinner'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'
import { fmt } from '@/lib/utils'
import type { Transaction, Category } from '@/types'

// ── Color helpers (same prefix-matching strategy as Dashboard) ─────────────

const PLAID_COLORS: Record<string, string> = {
  FOOD_AND_DRINK: '#D4775A', GENERAL_MERCHANDISE: '#3A8880',
  ENTERTAINMENT: '#C87AA8', TRANSPORTATION: '#7B68E8',
  TRAVEL: '#8B6BD4', HOME_IMPROVEMENT: '#C98A3A',
  RENT_AND_UTILITIES: '#C98A3A', MEDICAL: '#5B88C4',
  PERSONAL_CARE: '#5B88C4', GROCERIES: '#5A9E6A',
  INCOME: '#5A9E6A', TRANSFER_IN: '#4A9BA8',
  TRANSFER_OUT: '#B85450', LOAN_PAYMENTS: '#B85450',
  BANK_FEES: '#888', GOVERNMENT_AND_NON_PROFIT: '#6B5FD4',
}

function plaidColor(cat: string | null): string {
  if (!cat) return '#888'
  const parts = cat.split('_')
  for (let len = parts.length; len > 0; len--) {
    const key = parts.slice(0, len).join('_')
    if (PLAID_COLORS[key]) return PLAID_COLORS[key]
  }
  return '#888'
}

// ── Aggregation — uses plaid_category_detailed for richer grouping ─────────

function aggregatePlaid(txns: Transaction[]) {
  const m: Record<string, number> = {}
  txns.filter((t) => t.amount > 0).forEach((t) => {
    // Prefer detailed subcategory; fall back to broad category
    const k = t.plaid_category_detailed ?? t.plaid_category ?? ''
    if (!k) return
    m[k] = (m[k] ?? 0) + t.amount
  })
  return Object.entries(m)
    .map(([k, amt]) => ({
      label: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      amt,
      color: plaidColor(k),
    }))
    .sort((a, b) => b.amt - a.amt)
}

function aggregateCustom(txns: Transaction[], cats: Category[]) {
  const m: Record<string, number> = {}
  txns.filter((t) => t.amount > 0).forEach((t) => {
    const k = String(t.custom_category_id ?? '')
    if (!k) return
    m[k] = (m[k] ?? 0) + t.amount
  })
  const tagged = Object.entries(m)
    .map(([k, amt]) => {
      const cat = cats.find((c) => String(c.id) === k)
      return { label: cat?.label ?? k, amt, color: cat?.color ?? '#888' }
    })
    .sort((a, b) => b.amt - a.amt)

  const untaggedAmt = txns
    .filter((t) => !t.custom_category_id && t.amount > 0)
    .reduce((s, t) => s + t.amount, 0)

  if (untaggedAmt > 0) {
    tagged.push({ label: 'Untagged', amt: untaggedAmt, color: '#888' })
  }
  return tagged
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 bg-card rounded-xl p-4 border border-brd">
      <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-1">{label}</p>
      <p className="font-display font-extrabold text-[24px] tracking-tight" style={{ color: color ?? 'var(--ink)' }}>
        {value}
      </p>
    </div>
  )
}

function defaultRange(): DateRange {
  return {
    start: dayjs().startOf('month').format('YYYY-MM-DD'),
    end:   dayjs().format('YYYY-MM-DD'),
  }
}

export default function Insights() {
  const [range, setRange] = useState<DateRange>(defaultRange)

  const { transactions, loading } = useTransactions({ startDate: range.start, endDate: range.end })
  const { categories }            = useCategories()

  // Plaid: amount > 0 = expense, amount < 0 = credit/income
  const totalSpend  = useMemo(() => transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),              [transactions])
  const totalIncome = useMemo(() => transactions.filter((t) => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0),    [transactions])
  const untagged    = useMemo(() => transactions.filter((t) => !t.custom_category_id && t.amount > 0).length,                [transactions])
  const plaidData   = useMemo(() => aggregatePlaid(transactions),             [transactions])
  const customData  = useMemo(() => aggregateCustom(transactions, categories), [transactions, categories])

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto md:max-w-none">

      <div className="mb-6">
        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-1">Analysis</p>
        <h1 className="font-display font-extrabold text-[32px] text-ink leading-none tracking-tight mb-4">Insights</h1>
        <DateRangeFilter value={range} onChange={setRange} />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* Stats row */}
          <div className="flex gap-3 mb-6">
            <StatCard label="Spent"    value={fmt(totalSpend)} />
            {totalIncome > 0 && (
              <StatCard label="Income" value={fmt(totalIncome)} color="var(--accent)" />
            )}
            <StatCard
              label="Untagged"
              value={String(untagged)}
              color={untagged > 0 ? 'var(--warn)' : undefined}
            />
          </div>

          {/* Charts — both show all categories, no slice limit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plaidData.length > 0 ? (
              <div className="bg-card rounded-xl p-4 border border-brd">
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-4">
                  By Bank Category
                </p>
                <HBar data={plaidData} />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-4 border border-brd flex items-center justify-center min-h-[120px]">
                <p className="text-[13px] text-muted">No categorised expenses</p>
              </div>
            )}

            {customData.length > 0 ? (
              <div className="bg-card rounded-xl p-4 border border-brd">
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-4">
                  By Your Tags
                </p>
                <HBar data={customData} />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-4 border border-brd flex items-center justify-center min-h-[120px]">
                <p className="text-[13px] text-muted">No tagged transactions</p>
              </div>
            )}
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-16 text-muted text-[14px]">No data for this period</div>
          )}
        </>
      )}
    </div>
  )
}
