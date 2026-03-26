import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogContent,
  Divider,
  Grid,
  IconButton,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material'
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'
import SyncIcon from '@mui/icons-material/Sync'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import OpenInFullIcon from '@mui/icons-material/OpenInFull'
import CloseIcon from '@mui/icons-material/Close'
import dayjs from 'dayjs'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { usePlaidLink } from 'react-plaid-link'

import { useTransactions } from '@/hooks/useTransactions'
import { useCategories } from '@/hooks/useCategories'
import { usePlaidMappings } from '@/hooks/usePlaidMappings'
import { useAuth } from '@/context/AuthContext'
import { getLinkToken, linkAccount, syncTransactions } from '@/services/api'
import SpendingLineChart from '@/components/charts/SpendingLineChart'
import CategoryPieChart from '@/components/charts/CategoryPieChart'
import CustomCategoryPieChart from '@/components/charts/CustomCategoryPieChart'
import HistoricalBarChart from '@/components/charts/HistoricalBarChart'
import DateRangeSelector from '@/components/common/DateRangeSelector'

function getThreeMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: now.toISOString().slice(0, 10),
  }
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, color }: {
  label: string; value: string; sub?: string; icon: React.ReactNode; color: string
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5, textTransform: 'uppercase', fontSize: 10 }}>
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1.1 }}>
              {value}
            </Typography>
            {sub && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{sub}</Typography>}
          </Box>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// ── Expandable chart card ──────────────────────────────────────────────────────
function ChartCard({ title, children, sx }: { title: string; children: React.ReactNode; sx?: object }) {
  const [maximized, setMaximized] = useState(false)

  return (
    <>
      <Card sx={{ p: 2.5, height: '100%', position: 'relative', ...sx }}>
        <Tooltip title="Expand chart">
          <IconButton
            size="small"
            onClick={() => setMaximized(true)}
            sx={{
              position: 'absolute', top: 10, right: 10,
              color: 'text.secondary', opacity: 0.5,
              '&:hover': { opacity: 1, color: 'primary.main' },
            }}
          >
            <OpenInFullIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
        {children}
      </Card>

      <Dialog
        open={maximized}
        onClose={() => setMaximized(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          <Tooltip title="Close">
            <IconButton size="small" onClick={() => setMaximized(false)} sx={{ color: 'text.secondary' }}>
              <CloseIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <DialogContent sx={{ p: 3 }}>{children}</DialogContent>
      </Dialog>
    </>
  )
}

// ── Dashboard ──────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, refreshUser } = useAuth()
  const { startDate, endDate } = getThreeMonthRange()
  const { transactions, loading, error, refetch } = useTransactions({ startDate, endDate })
  const { categories } = useCategories()
  const { mappings } = usePlaidMappings()
  const [snack, setSnack] = useState<string | null>(null)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)

  const today = dayjs()
  const [outlierStart, setOutlierStart] = useState(today.startOf('month').format('YYYY-MM-DD'))
  const [outlierEnd, setOutlierEnd] = useState(today.format('YYYY-MM-DD'))

  useEffect(() => {
    if (!user || user.plaid_item_id) return
    let active = true
    getLinkToken().then((t) => { if (active) setLinkToken(t) }).catch(() => null)
    return () => { active = false }
  }, [user?.plaid_item_id])

  const thisMonthTransactions = useMemo(() => {
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)
    return transactions.filter((t) => t.transaction_date >= monthStart)
  }, [transactions])

  const totalThisMonth = useMemo(
    () => thisMonthTransactions.filter((t) => !t.pending).reduce((s, t) => s + t.amount, 0),
    [thisMonthTransactions],
  )

  const prevMonthTotal = useMemo(() => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10)
    const end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10)
    return transactions
      .filter((t) => !t.pending && t.transaction_date >= start && t.transaction_date <= end)
      .reduce((s, t) => s + t.amount, 0)
  }, [transactions])

  const monthDelta = prevMonthTotal > 0 ? ((totalThisMonth - prevMonthTotal) / prevMonthTotal) * 100 : null

  const outliers = useMemo(() => {
    const ranged = transactions.filter(
      (t) => !t.pending && t.amount > 0 && t.transaction_date >= outlierStart && t.transaction_date <= outlierEnd,
    )
    if (ranged.length < 3) return ranged.sort((a, b) => b.amount - a.amount)
    const amounts = ranged.map((t) => t.amount)
    const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length
    const std = Math.sqrt(amounts.reduce((s, a) => s + (a - mean) ** 2, 0) / amounts.length)
    return ranged.filter((t) => t.amount > mean + 2 * std).sort((a, b) => b.amount - a.amount)
  }, [transactions, outlierStart, outlierEnd])

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      const result = await syncTransactions()
      setSnack(`Synced: +${result.added} added, ${result.modified} modified, ${result.removed} removed`)
      refetch()
    } catch (err) {
      setSnack(err instanceof Error ? err.message : 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [refetch])

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: linkToken,
    onSuccess: async (publicToken) => {
      try {
        await linkAccount(publicToken)
        await refreshUser()
        setSnack('Bank linked!')
        refetch()
      } catch (err) {
        setSnack(err instanceof Error ? err.message : 'Failed to link account')
      }
    },
  })

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress sx={{ color: 'primary.main' }} />
      </Box>
    )
  }

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5">Spending Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {!user?.plaid_item_id ? (
            <Button
              variant="contained"
              startIcon={<AccountBalanceIcon />}
              onClick={() => openPlaid()}
              disabled={!plaidReady || !linkToken}
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
            >
              Link Bank Account
            </Button>
          ) : (
            <>
              <Button
                variant="outlined"
                startIcon={syncing ? <CircularProgress size={15} color="inherit" /> : <SyncIcon fontSize="small" />}
                onClick={handleSync}
                disabled={syncing}
                sx={{
                  borderRadius: 2, textTransform: 'none', fontWeight: 600,
                  borderColor: 'primary.main', color: 'primary.main',
                  '&:hover': { borderColor: 'primary.light', bgcolor: 'rgba(15,196,181,0.06)' },
                }}
              >
                {syncing ? 'Syncing…' : 'Sync'}
              </Button>
              <Button
                variant="text"
                startIcon={<AccountBalanceIcon fontSize="small" />}
                onClick={() => openPlaid()}
                disabled={!plaidReady || !linkToken}
                sx={{ borderRadius: 2, textTransform: 'none', color: 'text.secondary', fontSize: 13 }}
              >
                Relink
              </Button>
            </>
          )}
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stat cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Spent this month"
            value={`$${totalThisMonth.toFixed(2)}`}
            sub={monthDelta !== null ? `${monthDelta > 0 ? '+' : ''}${monthDelta.toFixed(1)}% vs last month` : undefined}
            icon={<TrendingDownIcon fontSize="small" />}
            color="#f04438"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Transactions"
            value={String(thisMonthTransactions.length)}
            sub="this month"
            icon={<TrendingUpIcon fontSize="small" />}
            color="#0fc4b5"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            label="Outlier charges"
            value={String(outliers.length)}
            sub="above 2σ threshold"
            icon={<WarningAmberIcon fontSize="small" />}
            color="#c9a227"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12}>
          <ChartCard title="Daily Spending">
            <SpendingLineChart transactions={thisMonthTransactions} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={7}>
          <ChartCard title="3-Month Overview">
            <HistoricalBarChart transactions={transactions} />
          </ChartCard>
        </Grid>
        <Grid item xs={12} md={5}>
          <ChartCard title="Spending by Plaid Category">
            <CategoryPieChart transactions={thisMonthTransactions} />
          </ChartCard>
        </Grid>
        {(categories.length > 0 || mappings.length > 0) && (
          <Grid item xs={12} md={6}>
            <ChartCard title="Spending by Custom Category">
              <CustomCategoryPieChart
                transactions={thisMonthTransactions}
                categories={categories}
                mappings={mappings}
              />
            </ChartCard>
          </Grid>
        )}
      </Grid>

      {/* Large charges */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningAmberIcon fontSize="small" sx={{ color: 'secondary.main' }} />
              <Typography variant="subtitle1" fontWeight={600} color="secondary.main">Large charges</Typography>
              <Typography variant="body2" color="text.secondary">· above 2σ threshold</Typography>
            </Box>
            <DateRangeSelector
              startDate={outlierStart}
              endDate={outlierEnd}
              onChange={(s, e) => { setOutlierStart(s); setOutlierEnd(e) }}
            />
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          {outliers.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
              No large charges in this period.
            </Typography>
          ) : (
            outliers.map((tx) => (
              <Box
                key={tx.id}
                sx={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  py: 1.25, px: 1, borderRadius: 1.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight={500}>{tx.merchant_name ?? tx.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{tx.transaction_date}</Typography>
                </Box>
                <Typography variant="body2" fontWeight={700} color="error.main">${tx.amount.toFixed(2)}</Typography>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack(null)} message={snack} />
    </Box>
  )
}
