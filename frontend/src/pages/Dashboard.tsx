import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, AlertCircle, ChevronRight, Link2, Clock } from 'lucide-react'
import dayjs from 'dayjs'
import { usePlaidLink } from 'react-plaid-link'

import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { useAuth } from '@/context/AuthContext'
import { useTopBarActions } from '@/context/TopBarActionsContext'
import { useThemeMode } from '@/context/ThemeContext'
import { getLinkToken, linkAccount, syncTransactions } from '@/services/api'
import { SparklineInteractive, type SparkPoint } from '@/components/ui/SparklineInteractive'
import { DateRangeFilter, type DateRange } from '@/components/ui/DateRangeFilter'
import { HBar } from '@/components/ui/HBar'
import { Pill } from '@/components/ui/Pill'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/useToast'
import { fmt, initials, avatarHue, relDate } from '@/lib/utils'
import type { Transaction, Category } from '@/types'

// ── Color helpers ──────────────────────────────────────────────────────────

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

// ── Aggregation ────────────────────────────────────────────────────────────

// Plaid sign convention (stored raw from API):
//   amount > 0  →  expense   (money leaves the account)
//   amount < 0  →  credit / refund / income (money enters the account)

function aggregatePlaid(txns: Transaction[]) {
  const m: Record<string, number> = {}
  txns.filter((t) => t.amount > 0).forEach((t) => {
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
    .slice(0, 8)
}

function aggregateCustom(txns: Transaction[], cats: Category[]) {
  const m: Record<string, number> = {}
  txns.filter((t) => t.amount > 0).forEach((t) => {
    const k = String(t.custom_category_id ?? '')
    if (!k) return
    m[k] = (m[k] ?? 0) + t.amount
  })
  return Object.entries(m)
    .map(([k, amt]) => {
      const cat = cats.find((c) => String(c.id) === k)
      return { label: cat?.label ?? k, amt, color: cat?.color ?? '#888' }
    })
    .sort((a, b) => b.amt - a.amt)
    .slice(0, 8)
}

// ── Last-sync helpers ──────────────────────────────────────────────────────

function fmtLastSync(iso: string | null): string {
  if (!iso) return 'Never'
  const diff = dayjs().diff(dayjs(iso), 'minute')
  if (diff < 1)  return 'Just now'
  if (diff < 60) return `${diff}m ago`
  const h = dayjs().diff(dayjs(iso), 'hour')
  if (h < 24)    return `${h}h ago`
  return dayjs(iso).format('MMM D')
}

// ── TxnRow ─────────────────────────────────────────────────────────────────

function TxnRow({ tx, cats, onTap }: { tx: Transaction; cats: Category[]; onTap: () => void }) {
  const cat  = cats.find((c) => c.id === tx.custom_category_id)
  const hue  = avatarHue(tx.merchant_name ?? tx.name)
  const name = tx.merchant_name ?? tx.name
  return (
    <button
      onClick={onTap}
      className="flex items-center gap-3 w-full px-4 py-3 text-left hover:bg-card transition-colors"
    >
      <div
        className="w-10 h-10 rounded-[11px] flex items-center justify-center flex-shrink-0 text-[12px] font-bold tracking-tight"
        style={{ background: `oklch(60% 0.06 ${hue} / 0.15)`, color: `oklch(60% 0.12 ${hue})` }}
      >
        {initials(name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <p className="text-[14px] font-semibold text-ink truncate">{name}</p>
          {tx.amount > 0 && !tx.custom_category_id && tx.plaid_category && (
            <span className="w-1.5 h-1.5 rounded-full bg-warn flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1.5 overflow-hidden">
          {tx.plaid_category && (
            <Pill
              label={tx.plaid_category.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
              color={plaidColor(tx.plaid_category)}
              size="sm"
            />
          )}
          {cat ? <Pill label={cat.label} color={cat.color} size="sm" /> : (
            <span className="text-[10px] text-faint font-medium">+ tag</span>
          )}
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
}

// ── Default range: last 30 days ────────────────────────────────────────────

function defaultRange(): DateRange {
  return {
    start: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    end:   dayjs().format('YYYY-MM-DD'),
  }
}

// ── Dashboard ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const { show, node: toastNode } = useToast()
  const { setActions } = useTopBarActions()
  const { mode } = useThemeMode()

  const [range, setRange]             = useState<DateRange>(defaultRange)
  const [syncing, setSyncing]         = useState(false)
  const [linkToken, setLinkToken]     = useState<string | null>(null)
  const [pendingOpen, setPendingOpen] = useState(false)
  const [lastSync, setLastSync]       = useState<string | null>(() => user?.last_synced_at ?? null)
  // postLinkSyncing: actively fetching after a fresh bank link
  // postLinkPending: sync completed but Plaid hasn't pushed data yet
  const [postLinkSyncing, setPostLinkSyncing] = useState(false)
  const [postLinkPending, setPostLinkPending] = useState(false)

  const isLinked = !!user?.plaid_item_id

  // Keep lastSync in sync with user profile (e.g. after page refresh)
  useEffect(() => {
    if (user?.last_synced_at) setLastSync(user.last_synced_at)
  }, [user?.last_synced_at])

  const { transactions, loading, refetch: refetchTransactions } = useTransactions({ startDate: range.start, endDate: range.end })
  const { categories }            = useCategories()

  // ── Derived stats ──────────────────────────────────────────────────────

  const totalSpend = useMemo(
    () => transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    [transactions],
  )
  const txnCount = useMemo(
    () => transactions.filter((t) => t.amount > 0).length,
    [transactions],
  )
  const daysInRange = useMemo(
    () => Math.max(dayjs(range.end).diff(dayjs(range.start), 'day') + 1, 1),
    [range],
  )
  const avgPerDay = totalSpend / daysInRange

  const untaggedCount = useMemo(
    () => transactions.filter((t) => !t.custom_category_id && t.amount > 0).length,
    [transactions],
  )

  const plaidData  = useMemo(() => aggregatePlaid(transactions),                 [transactions])
  const customData = useMemo(() => aggregateCustom(transactions, categories),    [transactions, categories])
  const recent     = useMemo(
    () => [...transactions].sort((a, b) => b.transaction_date.localeCompare(a.transaction_date)).slice(0, 5),
    [transactions],
  )

  // ── Sparkline: daily totals across selected range ──────────────────────

  const sparkData = useMemo((): SparkPoint[] => {
    const byDay: Record<string, number> = {}
    transactions.filter((t) => t.amount > 0).forEach((t) => {
      byDay[t.transaction_date] = (byDay[t.transaction_date] ?? 0) + t.amount
    })
    const days = daysInRange
    return Array.from({ length: days }, (_, i) => {
      const date = dayjs(range.start).add(i, 'day').format('YYYY-MM-DD')
      return { date, value: byDay[date] ?? 0 }
    })
  }, [transactions, range.start, daysInRange])

  // ── Range label ────────────────────────────────────────────────────────

  const rangeLabel = useMemo(() => {
    const s = dayjs(range.start)
    const e = dayjs(range.end)
    if (s.isSame(e, 'month')) return s.format('MMMM YYYY')
    if (s.isSame(e, 'year'))  return `${s.format('MMM')} – ${e.format('MMM YYYY')}`
    return `${s.format('MMM YYYY')} – ${e.format('MMM YYYY')}`
  }, [range])

  // ── Actions ────────────────────────────────────────────────────────────

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const r = await syncTransactions()
      if (r.last_synced_at) setLastSync(r.last_synced_at)
      await refetchTransactions()
      show(`Synced — ${r.added} new, ${r.modified} updated`)
    } catch (e) {
      show(e instanceof Error ? e.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [show, refetchTransactions])

  // After a fresh bank link, auto-sync with up to 3 attempts (Plaid may need a moment
  // to push historical data). Surfaces a "pending" banner if still empty after retries.
  const doInitialSync = useCallback(async () => {
    setPostLinkSyncing(true)
    setPostLinkPending(false)
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (attempt > 0) await new Promise<void>((r) => setTimeout(r, 3500))
        const r = await syncTransactions()
        if (r.last_synced_at) setLastSync(r.last_synced_at)
        if (r.added > 0) {
          await refetchTransactions()
          show(`${r.added} transaction${r.added === 1 ? '' : 's'} imported`)
          return
        }
      }
      // Plaid hasn't delivered data yet — surface a notice to the user
      setPostLinkPending(true)
    } catch {
      // Don't surface sync errors during initial import
    } finally {
      setPostLinkSyncing(false)
    }
  }, [show, refetchTransactions])

  // Pre-fetch token on mount so Plaid is ready before the user clicks
  useEffect(() => {
    if (!isLinked) getLinkToken().then(setLinkToken).catch(() => {})
  }, [isLinked])

  const { open: openPlaid, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: async (publicToken, meta) => {
      try {
        await linkAccount(publicToken, {
          institution_id:   meta.institution?.institution_id ?? null,
          institution_name: meta.institution?.name          ?? null,
        })
        await refreshUser()
        // Immediately start fetching transactions in the background
        doInitialSync()
      } catch (e) {
        show(e instanceof Error ? e.message : 'Link failed')
      }
    },
  })

  // Fallback: if user clicks before ready, open as soon as Plaid initialises
  useEffect(() => {
    if (pendingOpen && ready) {
      openPlaid()
      setPendingOpen(false)
    }
  }, [pendingOpen, ready, openPlaid])

  // Inject green sync button into TopBar
  useEffect(() => {
    if (!isLinked) { setActions(null); return }
    setActions(
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-opacity disabled:opacity-60"
        style={{ background: '#22c55e' }}
      >
        <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
        Sync
      </button>,
    )
    return () => setActions(null)
  }, [isLinked, syncing, handleSync, setActions])

  const accentColor = mode === 'light' ? '#22c55e' : 'var(--accent)'

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Spinner /></div>
  }

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto md:max-w-none">

      {/* No bank linked: full-page CTA or post-link importing state */}
      {!isLinked ? (
        postLinkSyncing ? (
          <div className="flex flex-col items-center justify-center py-28 gap-5">
            <Spinner />
            <p className="text-[14px] font-semibold text-ink">Importing your transactions…</p>
            <p className="text-[13px] text-muted">This usually takes a few seconds.</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-28 gap-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: `${accentColor}1a` }}
            >
              <Link2 size={28} style={{ color: accentColor }} />
            </div>
            <div className="text-center">
              <h2 className="font-display font-extrabold text-[24px] text-ink mb-2 tracking-tight">
                Connect your bank
              </h2>
              <p className="text-[14px] text-muted max-w-[320px] leading-relaxed">
                Link your bank via Plaid to start tracking and understanding your spending.
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 active:opacity-80"
              style={{ background: accentColor }}
              onClick={() => ready ? openPlaid() : setPendingOpen(true)}
            >
              <Link2 size={16} />
              Connect bank account
            </button>
          </div>
        )
      ) : (
        <>
          {/* Hero ─────────────────────────────────────────────────────── */}
          <div className="mb-5">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-2">
              {rangeLabel} · Spending
            </p>
            <h1 className="font-display font-extrabold text-[48px] leading-none tracking-[-1.5px] text-ink mb-3">
              {fmt(totalSpend)}
            </h1>

            {/* Metadata row */}
            <div className="flex items-center gap-5 mb-4 flex-wrap">
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">Transactions</p>
                <p className="text-[20px] font-bold text-ink">{txnCount}</p>
              </div>
              <div className="w-px h-8 bg-brd" />
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">Avg / Day</p>
                <p className="text-[20px] font-bold text-ink">{fmt(avgPerDay)}</p>
              </div>
              <div className="w-px h-8 bg-brd" />
              <div>
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">Last Synced</p>
                <p className="text-[20px] font-bold text-ink">{fmtLastSync(lastSync)}</p>
              </div>
            </div>

            {/* Interactive sparkline – driven by selected range, daily totals */}
            <SparklineInteractive
              data={sparkData}
              color="var(--accent)"
              height={72}
            />
          </div>

          {/* Date range filter */}
          <DateRangeFilter value={range} onChange={setRange} className="mb-5" />

          {/* Post-link pending: Plaid hasn't delivered data yet */}
          {postLinkPending && (
            <div
              className="w-full flex items-center gap-3 p-3.5 rounded-xl mb-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Clock size={16} className="text-muted flex-shrink-0" />
              <p className="text-[13px] text-muted flex-1">
                Your transaction history is being imported — it'll appear here shortly.
              </p>
            </div>
          )}

          {/* Untagged alert */}
          {untaggedCount > 0 && (
            <button
              onClick={() => navigate('/transactions')}
              className="w-full flex items-center gap-3 p-3.5 rounded-xl mb-4 text-left"
              style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn)33' }}
            >
              <AlertCircle size={18} className="text-warn flex-shrink-0" />
              <p className="text-[13px] font-semibold text-warn flex-1">
                {untaggedCount} transaction{untaggedCount > 1 ? 's' : ''} need{untaggedCount === 1 ? 's' : ''} a tag
              </p>
              <ChevronRight size={16} className="text-warn/60" />
            </button>
          )}

          {/* Charts grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {plaidData.length > 0 ? (
              <div className="bg-card rounded-xl p-4 border border-brd">
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-4">By Bank Category</p>
                <HBar data={plaidData} />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-4 border border-brd flex items-center justify-center min-h-[120px]">
                <p className="text-[13px] text-muted text-center">No expense data yet</p>
              </div>
            )}
            {customData.length > 0 ? (
              <div className="bg-card rounded-xl p-4 border border-brd">
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-4">By Your Tags</p>
                <HBar data={customData} />
              </div>
            ) : (
              <div className="bg-card rounded-xl p-4 border border-brd flex flex-col items-center justify-center gap-2 min-h-[120px]">
                <p className="text-[13px] text-muted text-center">Tag transactions to see your custom breakdown</p>
                <button onClick={() => navigate('/transactions')} className="text-[13px] font-semibold text-accent">
                  Start tagging →
                </button>
              </div>
            )}
          </div>

          {/* Recent */}
          {recent.length > 0 && (
            <div className="bg-card rounded-xl border border-brd overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-brd">
                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em]">Recent</p>
                <button onClick={() => navigate('/transactions')} className="text-[12px] font-semibold text-accent">
                  See all
                </button>
              </div>
              {recent.map((tx) => (
                <TxnRow key={tx.id} tx={tx} cats={categories} onTap={() => navigate('/transactions')} />
              ))}
            </div>
          )}

          {transactions.length === 0 && isLinked && (
            <div className="text-center py-16">
              <p className="text-[15px] text-muted mb-2">No transactions in this period</p>
              <button onClick={handleSync} className="text-[14px] font-semibold text-accent">Sync now</button>
            </div>
          )}
        </>
      )}

      {toastNode}
    </div>
  )
}
