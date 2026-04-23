import { useState, useMemo, useCallback } from 'react'
import { Plus, X } from 'lucide-react'
import dayjs from 'dayjs'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'

import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useNewTransactions } from '@/hooks/useNewTransactions'
import { Drawer } from '@/components/ui/Drawer'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/useToast'
import { fmt, initials, avatarHue, relDate, groupByDate, cn } from '@/lib/utils'
import type { Transaction, Category } from '@/types'

const PLAID_COLORS: Record<string, string> = {
  FOOD_AND_DRINK: '#D4775A', GENERAL_MERCHANDISE: '#3A8880', ENTERTAINMENT: '#C87AA8',
  TRANSPORTATION: '#7B68E8', TRAVEL: '#8B6BD4', HOME_IMPROVEMENT: '#C98A3A',
  RENT_AND_UTILITIES: '#C98A3A', MEDICAL: '#5B88C4', PERSONAL_CARE: '#5B88C4',
  GROCERIES: '#5A9E6A', INCOME: '#5A9E6A',
}
const plaidColor = (cat: string | null) => PLAID_COLORS[cat ?? ''] ?? '#888'
const plaidLabel = (cat: string | null) => cat?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? ''

const SWATCH = ['#C4634A','#3A8880','#6B5FD4','#4E8E5C','#A87830','#C87AA8','#5B88C4','#8B6BD4','#4A9BA8','#B85450']

function getDefaultDates(): DateRange {
  const today = dayjs()
  return { start: today.subtract(29, 'day').format('YYYY-MM-DD'), end: today.format('YYYY-MM-DD') }
}

// ── Create tag form ──
function CreateTagForm({ onSave, onClose }: { onSave: (d: { label: string; value: string; color: string }) => void; onClose: () => void }) {
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(SWATCH[0])
  const slug = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  return (
    <div className="px-5 pb-6">
      <div className="flex items-center justify-between py-4 border-b border-brd mb-5">
        <p className="font-display font-bold text-[17px] text-ink">New Tag</p>
        <button onClick={onClose} className="text-muted hover:text-ink"><X size={18} /></button>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Name</p>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Date nights"
          className="w-full px-3.5 py-3 rounded-xl bg-card border border-brd text-[15px] text-ink outline-none focus:border-accent transition-colors placeholder:text-faint"
        />
        {slug && <p className="text-[11px] text-faint mt-1.5 font-mono">{slug}</p>}
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2.5">Color</p>
        <div className="flex gap-2 flex-wrap">
          {SWATCH.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={cn('w-8 h-8 rounded-[9px] border-none transition-all', color === c && 'ring-2 ring-ink')}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {label && <div className="mb-5"><Pill label={label} color={color} /></div>}

      <div className="flex gap-2.5">
        <button onClick={onClose} className="flex-1 py-3.5 rounded-[13px] bg-card border border-brd text-[14px] font-semibold text-muted">
          Cancel
        </button>
        <button
          disabled={!label}
          onClick={() => label && onSave({ label, value: slug || `tag_${Date.now()}`, color })}
          className="flex-[2] py-3.5 rounded-[13px] text-[14px] font-bold text-white disabled:opacity-40 transition-colors"
          style={{ background: label ? 'var(--accent)' : 'var(--faint)' }}
        >
          Create tag
        </button>
      </div>
    </div>
  )
}

// ── Tag assignment content ──
function TagSheetContent({
  tx, cats, onAssign, onClear, onCreateCat,
}: {
  tx: Transaction; cats: Category[]
  onAssign: (txId: number, catId: number) => void
  onClear: (txId: number) => void
  onCreateCat: () => void
}) {
  const displayName = tx.merchant_name ?? tx.name
  const hasMerchantAlias = tx.merchant_name && tx.merchant_name !== tx.name
  const hue = avatarHue(displayName)
  const payChannel = tx.payment_channel?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const detailedCat = tx.plaid_category_detailed?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  const currency = tx.currency_code ?? 'USD'
  const isExpense = tx.amount > 0  // Plaid: positive = money out (expense)

  return (
    <div className="px-5 pb-4">
      {/* Header: avatar + name */}
      <div className="flex items-center gap-3 py-4 border-b border-brd mb-0">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0 text-[15px] font-bold"
          style={{ background: `oklch(60% 0.06 ${hue} / 0.15)`, color: `oklch(60% 0.12 ${hue})` }}
        >
          {initials(displayName)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] font-bold text-ink truncate">{displayName}</p>
          {hasMerchantAlias && (
            <p className="text-[11px] text-faint truncate">{tx.name}</p>
          )}
        </div>
      </div>

      {/* Price hero */}
      <div className="py-5 border-b border-brd mb-4 flex items-end gap-2">
        <p className={cn(
          'font-display font-extrabold leading-none tracking-tight',
          Math.abs(tx.amount) >= 1000 ? 'text-[38px]' : 'text-[44px]',
          isExpense ? 'text-ink' : 'text-[#22c55e]'
        )}>
          {isExpense ? '−' : '+'}{fmt(Math.abs(tx.amount))}
        </p>
        <div className="mb-1.5 flex flex-col items-start gap-1">
          <span className="text-[11px] font-bold text-muted uppercase tracking-wider">{currency}</span>
          {tx.pending && (
            <span className="text-[10px] font-semibold text-warn bg-warn-bg px-2 py-0.5 rounded-full">Pending</span>
          )}
        </div>
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-3 pb-4 border-b border-brd mb-4">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Date</p>
          <p className="text-[13px] text-ink font-medium">{dayjs(tx.transaction_date).format('MMM D, YYYY')}</p>
        </div>
        {payChannel && (
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Channel</p>
            <p className="text-[13px] text-ink font-medium">{payChannel}</p>
          </div>
        )}
        {tx.authorized_date && tx.authorized_date !== tx.transaction_date && (
          <div>
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Auth Date</p>
            <p className="text-[13px] text-ink font-medium">{dayjs(tx.authorized_date).format('MMM D, YYYY')}</p>
          </div>
        )}
        {detailedCat && (
          <div className="col-span-2">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">Subcategory</p>
            <p className="text-[13px] text-muted font-medium">{detailedCat}</p>
          </div>
        )}
      </div>

      {/* Bank category (read-only) */}
      {tx.plaid_category && (
        <div className="pb-4 border-b border-brd mb-4">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Bank Category</p>
          <Pill label={plaidLabel(tx.plaid_category)} color={plaidColor(tx.plaid_category)} />
          <p className="text-[11px] text-faint mt-1.5">Assigned by Plaid · read-only</p>
        </div>
      )}

      {/* Your tag */}
      <div className="mb-2">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Your Tag</p>
          {tx.custom_category_id && (
            <button onClick={() => onClear(tx.id)} className="text-[11px] text-red font-semibold">Remove</button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {cats.map((cat) => {
            const active = tx.custom_category_id === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => onAssign(tx.id, cat.id)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all"
                style={{
                  background: active ? `${cat.color}14` : 'var(--card)',
                  border: `1.5px solid ${active ? cat.color + '60' : 'var(--border)'}`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: cat.color }} />
                <span className={cn('flex-1 text-[14px] text-ink', active ? 'font-semibold' : 'font-medium')}>{cat.label}</span>
                {active && (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8.5l3.5 3.5 6.5-7" stroke={cat.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            )
          })}
          <button
            onClick={onCreateCat}
            className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-left transition-colors"
            style={{ border: '1.5px dashed var(--border)' }}
          >
            <Plus size={16} className="text-accent" />
            <span className="text-[14px] font-medium text-accent">Create new tag</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Main page ──
export default function Transactions() {
  const [range, setRange] = useState<DateRange>(getDefaultDates)
  const [filter, setFilter] = useState<'all' | 'untagged'>('all')
  const [selected, setSelected] = useState<Transaction | null>(null)
  const [creating, setCreating] = useState(false)
  const { show, node: toastNode } = useToast()

  const { transactions, loading, loadingMore, hasMore, loadMore, tagCategory, clearCategory } = useTransactions({ startDate: range.start, endDate: range.end, paginated: true })
  const { categories, create: createCategory } = useCategories()
  const { isNew, dismiss } = useNewTransactions()

  const handleTag = useCallback(async (txId: number, catId: number) => {
    await tagCategory(txId, catId)
    dismiss(txId)
    setSelected((prev) => prev?.id === txId ? { ...prev, custom_category_id: catId } : prev)
  }, [tagCategory, dismiss])

  const handleClear = useCallback(async (txId: number) => {
    await clearCategory(txId)
    setSelected((prev) => prev?.id === txId ? { ...prev, custom_category_id: null } : prev)
  }, [clearCategory])

  const handleCreateCat = async (data: { label: string; value: string; color: string }) => {
    const cat = await createCategory(data)
    if (selected) { await handleTag(selected.id, cat.id) }
    setCreating(false)
    show(`Tag "${cat.label}" created`)
  }

  const displayed = useMemo(() => {
    // amount > 0 = expense (Plaid convention); only expenses need tags
    if (filter === 'untagged') return transactions.filter((t) => !t.custom_category_id && t.amount > 0)
    return transactions
  }, [transactions, filter])

  const untaggedCount = useMemo(() => transactions.filter((t) => !t.custom_category_id && t.amount > 0).length, [transactions])
  const grouped = useMemo(() => groupByDate(displayed), [displayed])

  return (
    <div className="max-w-2xl mx-auto md:max-w-none">
      {/* Page header */}
      <div className="px-4 md:px-8 pt-5 pb-4 border-b border-brd">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-1">All activity</p>
        <h1 className="font-display font-extrabold text-[32px] text-ink leading-none tracking-tight mb-4">Transactions</h1>

        {/* Date range filter */}
        <DateRangeFilter value={range} onChange={setRange} className="mb-3" />

        {/* Filter chips */}
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setFilter('all')}
            className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors border whitespace-nowrap', filter === 'all' ? 'bg-accent text-white border-transparent' : 'bg-card text-muted border-brd')}
          >
            All
          </button>
          <button
            onClick={() => setFilter('untagged')}
            className={cn('flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold transition-colors border whitespace-nowrap', filter === 'untagged' ? 'bg-warn text-white border-transparent' : 'bg-card border-brd', filter !== 'untagged' && untaggedCount > 0 ? 'text-warn' : filter !== 'untagged' ? 'text-muted' : '')}
          >
            Needs tag{untaggedCount > 0 ? ` · ${untaggedCount}` : ''}
          </button>
        </div>
      </div>

      {/* Transaction list */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : grouped.length === 0 ? (
        <div className="text-center py-16 text-muted text-[14px]">No transactions found</div>
      ) : (
        <div className="pt-2 pb-4">
          {grouped.map(([date, txns]) => {
            const dayTotal = txns.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0)
            return (
              <div key={date} className="mb-3">
                {/* Date header */}
                <div className="flex items-center justify-between px-4 md:px-8 pt-2 pb-1.5">
                  <p className="text-[12px] font-semibold text-muted">{relDate(date)}</p>
                  {dayTotal > 0 && <p className="text-[12px] font-semibold text-muted">−{fmt(dayTotal)}</p>}
                </div>

                {/* Card container */}
                <div className="mx-4 md:mx-8 bg-card rounded-lg overflow-hidden">
                  {txns.map((tx, i) => {
                    const cat = categories.find((c) => c.id === tx.custom_category_id)
                    const name = tx.merchant_name ?? tx.name
                    const hue = avatarHue(name)
                    const newTx = isNew(tx) && !tx.custom_category_id && tx.amount > 0
                    return (
                      <button
                        key={tx.id}
                        onClick={() => setSelected(tx)}
                        className={cn(
                          'flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-card-b transition-colors',
                          i < txns.length - 1 && 'border-b border-brd'
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0 text-[12px] font-bold"
                          style={{ background: `oklch(60% 0.06 ${hue} / 0.15)`, color: `oklch(60% 0.12 ${hue})` }}
                        >
                          {initials(name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="text-[14px] font-semibold text-ink truncate">{name}</p>
                            {newTx && <span className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />}
                          </div>
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {tx.plaid_category && <Pill label={plaidLabel(tx.plaid_category)} color={plaidColor(tx.plaid_category)} size="sm" />}
                            {cat ? <Pill label={cat.label} color={cat.color} size="sm" /> : <span className="text-[10px] text-faint font-medium">+ tag</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-display font-bold text-[14px] text-ink">
                            {tx.amount < 0 ? '+' : ''}{fmt(tx.amount)}
                          </p>
                          <p className="text-[11px] text-faint mt-0.5">{relDate(tx.transaction_date)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {hasMore && (
            <div className="flex justify-center py-6">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-2.5 bg-card border border-brd rounded-full text-[13px] font-semibold text-muted hover:text-ink transition-colors"
              >
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tag assignment drawer (Sheet on mobile, Modal on desktop) */}
      <Drawer
        open={!!selected && !creating}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <TagSheetContent
            tx={selected}
            cats={categories}
            onAssign={handleTag}
            onClear={handleClear}
            onCreateCat={() => setCreating(true)}
          />
        )}
      </Drawer>

      {/* Create tag drawer */}
      <Drawer open={creating} onClose={() => setCreating(false)}>
        <CreateTagForm onSave={handleCreateCat} onClose={() => setCreating(false)} />
      </Drawer>

      {toastNode}
    </div>
  )
}
