import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import { useState } from 'react'
import type { Category, PlaidMapping, Transaction } from '@/types'
import TransactionRow from './TransactionRow'
import TransactionDetailModal from './TransactionDetailModal'

const PLAID_PALETTE = [
  '#0fc4b5', '#c9a227', '#6366f1', '#ec4899', '#f97316',
  '#22c55e', '#3b82f6', '#a855f7', '#ef4444', '#14b8a6',
  '#f59e0b', '#64748b', '#06b6d4', '#84cc16', '#e879f9',
]
function hashColor(label: string): string {
  let h = 0
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0
  return PLAID_PALETTE[h % PLAID_PALETTE.length]
}

interface Props {
  transactions: Transaction[]
  categories: Category[]
  mappings: PlaidMapping[]
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function MobileTransactionCard({
  tx,
  categories,
  mappings,
  onClick,
}: {
  tx: Transaction
  categories: Category[]
  mappings: PlaidMapping[]
  onClick: () => void
}) {
  const plaidColor = tx.plaid_category ? hashColor(tx.plaid_category) : null
  const isDebit = tx.amount > 0

  const customCat = tx.custom_category_id
    ? categories.find((c) => c.id === tx.custom_category_id)
    : (() => {
        if (!tx.plaid_category) return undefined
        const mapping = mappings.find((m) => m.plaid_category === tx.plaid_category)
        return mapping ? categories.find((c) => c.id === mapping.custom_category_id) : undefined
      })()
  const isAutoMapped = !tx.custom_category_id && !!customCat

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, cursor: 'pointer', '&:hover': { borderColor: 'primary.main' } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
          {tx.logo_url ? (
            <Avatar src={tx.logo_url} sx={{ width: 34, height: 34, flexShrink: 0 }} />
          ) : (
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'rgba(255,255,255,0.06)', fontSize: 13, color: 'text.secondary', fontWeight: 700, flexShrink: 0 }}>
              {(tx.merchant_name ?? tx.name)[0]?.toUpperCase()}
            </Avatar>
          )}
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap>{tx.merchant_name ?? tx.name}</Typography>
            <Typography variant="caption" color="text.secondary">{tx.transaction_date}</Typography>
          </Box>
        </Box>
        <Tooltip title={tx.pending ? 'Pending' : ''}>
          <Typography variant="body2" fontWeight={700} color={isDebit ? 'error.main' : 'success.main'} sx={{ opacity: tx.pending ? 0.6 : 1, flexShrink: 0, ml: 1 }}>
            {isDebit ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
          </Typography>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        {plaidColor && tx.plaid_category && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${plaidColor}18`, border: `1px solid ${plaidColor}44` }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: plaidColor, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: plaidColor, lineHeight: 1.2 }}>
              {tx.plaid_category.replace(/_/g, ' ')}
            </Typography>
          </Box>
        )}
        {customCat && (
          <Tooltip title={isAutoMapped ? 'Auto-mapped from Plaid category' : ''}>
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${customCat.color}18`, border: `1px solid ${customCat.color}44` }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: customCat.color, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: customCat.color, lineHeight: 1.2 }}>
                {customCat.label}
              </Typography>
              {isAutoMapped && (
                <Typography variant="caption" sx={{ fontSize: 9, color: customCat.color, opacity: 0.7, ml: 0.25 }}>auto</Typography>
              )}
            </Box>
          </Tooltip>
        )}
      </Box>
    </Paper>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────
export default function TransactionList({ transactions, categories, mappings, hasMore, loadingMore, onLoadMore }: Props) {
  const [selected, setSelected] = useState<Transaction | null>(null)

  if (!transactions.length) {
    return (
      <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
        No transactions found for this period.
      </Typography>
    )
  }

  return (
    <>
      {/* Mobile card list */}
      <Box sx={{ display: { xs: 'flex', sm: 'none' }, flexDirection: 'column', gap: 1.5 }}>
        {transactions.map((tx) => (
          <MobileTransactionCard
            key={tx.id}
            tx={tx}
            categories={categories}
            mappings={mappings}
            onClick={() => setSelected(tx)}
          />
        ))}
      </Box>

      {/* Desktop table */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ display: { xs: 'none', sm: 'block' }, border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'rgba(255,255,255,0.02)' }}>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12, pl: 2.5 }}>Merchant</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12 }}>Transaction Category</TableCell>
              <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12 }}>Custom Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: 12, pr: 2.5 }}>Amount</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {transactions.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                categories={categories}
                mappings={mappings}
                onClick={() => setSelected(tx)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Load more */}
      {hasMore && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2.5 }}>
          <Button
            variant="outlined"
            onClick={onLoadMore}
            disabled={loadingMore}
            startIcon={loadingMore ? <CircularProgress size={14} color="inherit" /> : undefined}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'primary.main', color: 'primary.main' } }}
          >
            {loadingMore ? 'Loading…' : 'Load more'}
          </Button>
        </Box>
      )}

      <TransactionDetailModal
        transaction={selected}
        categories={categories}
        onClose={() => setSelected(null)}
      />
    </>
  )
}
