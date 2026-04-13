import {
  Avatar,
  Box,
  TableCell,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material'
import type { Category, PlaidMapping, Transaction } from '@/types'
import type { CategoryFormData } from '@/components/categories/CategoryFormModal'
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
  transaction: Transaction
  categories: Category[]
  mappings: PlaidMapping[]
  isNew: boolean
  onClick: () => void
  onTag: (catId: number) => Promise<void>
  onClear: () => Promise<void>
  onDismiss: () => void
  onCreate: (data: CategoryFormData) => Promise<Category>
}

// Keyframe for the "new" pulsing indicator dot
const pulseKeyframes = {
  '@keyframes newPulse': {
    '0%, 100%': { opacity: 1, transform: 'scale(1)' },
    '50%': { opacity: 0.4, transform: 'scale(0.85)' },
  },
}

export default function TransactionRow({
  transaction,
  categories,
  mappings,
  isNew,
  onClick,
  onTag,
  onClear,
  onDismiss,
  onCreate,
}: Props) {
  const plaidColor = transaction.plaid_category ? hashColor(transaction.plaid_category) : null

  // Auto-mapped category (for display only — the dropdown manages direct tags)
  const autoMappedCat = !transaction.custom_category_id && transaction.plaid_category
    ? (() => {
        const mapping = mappings.find((m) => m.plaid_category === transaction.plaid_category)
        return mapping ? categories.find((c) => c.id === mapping.custom_category_id) : undefined
      })()
    : undefined

  return (
    <TableRow
      hover
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        ...pulseKeyframes,
        // "New" row highlight: left border + subtle tint
        ...(isNew && {
          bgcolor: 'rgba(15,196,181,0.025)',
          '& > td:first-of-type': {
            borderLeft: '3px solid',
            borderLeftColor: 'primary.main',
          },
        }),
        '&:hover td': { bgcolor: 'rgba(255,255,255,0.015)' },
      }}
    >
      {/* ── Merchant ──────────────────────────────────────────────────────── */}
      <TableCell sx={{ pl: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {transaction.logo_url ? (
            <Avatar src={transaction.logo_url} sx={{ width: 30, height: 30, flexShrink: 0 }} />
          ) : (
            <Avatar sx={{ width: 30, height: 30, bgcolor: 'rgba(255,255,255,0.06)', fontSize: 12, color: 'text.secondary', fontWeight: 700, flexShrink: 0 }}>
              {(transaction.merchant_name ?? transaction.name)[0]?.toUpperCase()}
            </Avatar>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 200 }}>
                {transaction.merchant_name ?? transaction.name}
              </Typography>
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
            <Typography variant="caption" color="text.secondary">{transaction.transaction_date}</Typography>
          </Box>
        </Box>
      </TableCell>

      {/* ── Plaid category ────────────────────────────────────────────────── */}
      <TableCell>
        {transaction.plaid_category && plaidColor && (
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${plaidColor}18`, border: `1px solid ${plaidColor}44`, maxWidth: 200 }}>
            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: plaidColor, flexShrink: 0 }} />
            <Typography variant="caption" noWrap sx={{ fontSize: 11, fontWeight: 600, color: plaidColor, lineHeight: 1.2 }}>
              {transaction.plaid_category.replace(/_/g, ' ')}
            </Typography>
          </Box>
        )}
      </TableCell>

      {/* ── Custom category dropdown ──────────────────────────────────────── */}
      <TableCell onClick={(e) => e.stopPropagation()}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CategoryDropdown
            transaction={transaction}
            categories={categories}
            isNew={isNew}
            onTag={onTag}
            onClear={onClear}
            onDismiss={onDismiss}
            onCreate={onCreate}
          />
          {/* Auto-mapped indicator (read-only, shown alongside the dropdown) */}
          {autoMappedCat && (
            <Tooltip title="Auto-mapped from Plaid category">
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1, py: 0.3, borderRadius: 1.5, bgcolor: `${autoMappedCat.color}12`, border: `1px solid ${autoMappedCat.color}30` }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: autoMappedCat.color, flexShrink: 0 }} />
                <Typography variant="caption" noWrap sx={{ fontSize: 11, fontWeight: 600, color: autoMappedCat.color, lineHeight: 1.2, opacity: 0.85 }}>
                  {autoMappedCat.label}
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 9, color: autoMappedCat.color, opacity: 0.6 }}>auto</Typography>
              </Box>
            </Tooltip>
          )}
        </Box>
      </TableCell>

      {/* ── Amount ───────────────────────────────────────────────────────── */}
      <TableCell align="right" sx={{ pr: 2.5 }}>
        <Tooltip title={transaction.pending ? 'Pending' : ''}>
          <Typography
            variant="body2"
            fontWeight={600}
            color={transaction.amount > 0 ? 'error.main' : 'success.main'}
            sx={{ opacity: transaction.pending ? 0.6 : 1 }}
          >
            {transaction.amount > 0 ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
          </Typography>
        </Tooltip>
      </TableCell>
    </TableRow>
  )
}
