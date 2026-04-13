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
import type { CategoryFormData } from '@/components/categories/CategoryFormModal'
import TransactionRow from './TransactionRow'
import TransactionDetailModal from './TransactionDetailModal'
import CategoryDropdown from './CategoryDropdown'

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
  isNew?: (tx: Transaction) => boolean
  onTag?: (txId: number, catId: number) => Promise<void>
  onClear?: (txId: number) => Promise<void>
  onDismiss?: (txId: number) => void
  onCreate?: (data: CategoryFormData) => Promise<Category>
}

// ── Mobile card ───────────────────────────────────────────────────────────────
function MobileTransactionCard({
  tx,
  categories,
  mappings,
  isNew,
  onClick,
  onTag,
  onClear,
  onDismiss,
  onCreate,
}: {
  tx: Transaction
  categories: Category[]
  mappings: PlaidMapping[]
  isNew: boolean
  onClick: () => void
  onTag: (catId: number) => Promise<void>
  onClear: () => Promise<void>
  onDismiss: () => void
  onCreate: (data: CategoryFormData) => Promise<Category>
}) {
  const plaidColor = tx.plaid_category ? hashColor(tx.plaid_category) : null
  const isDebit = tx.amount > 0

  const autoMappedCat = !tx.custom_category_id && tx.plaid_category
    ? (() => {
        const mapping = mappings.find((m) => m.plaid_category === tx.plaid_category)
        return mapping ? categories.find((c) => c.id === mapping.custom_category_id) : undefined
      })()
    : undefined

  return (
    <Paper
      elevation={0}
      onClick={onClick}
      sx={{
        border: '1px solid',
        borderColor: isNew ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 2,
        cursor: 'pointer',
        position: 'relative',
        // Subtle tint for new transactions
        ...(isNew && { bgcolor: 'rgba(15,196,181,0.025)' }),
        '&:hover': { borderColor: 'primary.main' },
        '@keyframes newPulse': {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.4, transform: 'scale(0.85)' },
        },
      }}
    >
      {/* Header row: merchant + amount */}
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{tx.merchant_name ?? tx.name}</Typography>
              {isNew && (
                <Tooltip title="Newly synced — add a category or mark as reviewed">
                  <Box
                    sx={{
                      width: 7, height: 7, borderRadius: '50%',
                      bgcolor: 'primary.main', flexShrink: 0,
                      animation: 'newPulse 2s ease-in-out infinite',
                    }}
                  />
                </Tooltip>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary">{tx.transaction_date}</Typography>
          </Box>
        </Box>
        <Tooltip title={tx.pending ? 'Pending' : ''}>
          <Typography variant="body2" fontWeight={700} color={isDebit ? 'error.main' : 'success.main'} sx={{ opacity: tx.pending ? 0.6 : 1, flexShrink: 0, ml: 1 }}>
            {isDebit ? '-' : '+'}${Math.abs(tx.amount).toFixed(2)}
          </Typography>
        </Tooltip>
      </Box>

      {/* Category chips + dropdown */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        {plaidColor && tx.plaid_category && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${plaidColor}18`, border: `1px solid ${plaidColor}44` }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: plaidColor, flexShrink: 0 }} />
            <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: plaidColor, lineHeight: 1.2 }}>
              {tx.plaid_category.replace(/_/g, ' ')}
            </Typography>
          </Box>
        )}
        {autoMappedCat && (
          <Tooltip title="Auto-mapped from Plaid category">
            <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${autoMappedCat.color}12`, border: `1px solid ${autoMappedCat.color}30` }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: autoMappedCat.color, flexShrink: 0 }} />
              <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 600, color: autoMappedCat.color, lineHeight: 1.2, opacity: 0.85 }}>
                {autoMappedCat.label}
              </Typography>
              <Typography variant="caption" sx={{ fontSize: 9, color: autoMappedCat.color, opacity: 0.6 }}>auto</Typography>
            </Box>
          </Tooltip>
        )}
        <CategoryDropdown
          transaction={tx}
          categories={categories}
          isNew={isNew}
          onTag={onTag}
          onClear={onClear}
          onDismiss={onDismiss}
          onCreate={onCreate}
        />
      </Box>
    </Paper>
  )
}

// ── Main list ─────────────────────────────────────────────────────────────────
export default function TransactionList({
  transactions,
  categories,
  mappings,
  hasMore,
  loadingMore,
  onLoadMore,
  isNew = () => false,
  onTag = async () => {},
  onClear = async () => {},
  onDismiss = () => {},
  onCreate = async () => ({ id: 0, label: '', value: '', color: '', created_at: '', updated_at: '' }),
}: Props) {
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
            isNew={isNew(tx)}
            onClick={() => setSelected(tx)}
            onTag={(catId) => onTag(tx.id, catId)}
            onClear={() => onClear(tx.id)}
            onDismiss={() => onDismiss(tx.id)}
            onCreate={onCreate}
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
                isNew={isNew(tx)}
                onClick={() => setSelected(tx)}
                onTag={(catId) => onTag(tx.id, catId)}
                onClear={() => onClear(tx.id)}
                onDismiss={() => onDismiss(tx.id)}
                onCreate={onCreate}
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
