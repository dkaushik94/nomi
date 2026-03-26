import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import CheckIcon from '@mui/icons-material/Check'
import { useState } from 'react'
import { PLAID_CATEGORIES, PLAID_CATEGORY_GROUPS } from '@/constants/plaidCategories'
import type { Category, PlaidMapping } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  category: Category
  /** All mappings across all of this user's categories */
  allMappings: PlaidMapping[]
  /** All user categories (to show which category owns a conflicting mapping) */
  allCategories: Category[]
  onAssign: (plaidCategory: string, customCategoryId: number) => Promise<void>
  onUnassign: (plaidCategory: string) => Promise<void>
}

export default function PlaidMappingEditor({
  open,
  onClose,
  category,
  allMappings,
  allCategories,
  onAssign,
  onUnassign,
}: Props) {
  const [busy, setBusy] = useState<string | null>(null) // plaid_category key being toggled

  const mappedToThis = new Set(
    allMappings.filter((m) => m.custom_category_id === category.id).map((m) => m.plaid_category)
  )

  const ownedByOther = new Map(
    allMappings
      .filter((m) => m.custom_category_id !== category.id)
      .map((m) => {
        const owner = allCategories.find((c) => c.id === m.custom_category_id)
        return [m.plaid_category, owner]
      })
  )

  const toggle = async (plaidKey: string) => {
    if (busy) return
    setBusy(plaidKey)
    try {
      if (mappedToThis.has(plaidKey)) {
        await onUnassign(plaidKey)
      } else {
        await onAssign(plaidKey, category.id)
      }
    } finally {
      setBusy(null)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 3 } }}
    >
      {/* Header */}
      <Box sx={{ px: 3, pt: 3, pb: 2, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: category.color }} />
            <Typography variant="h6" fontWeight={700}>Map Plaid Categories</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Select which Plaid categories roll up into{' '}
            <Typography component="span" variant="body2" fontWeight={600} sx={{ color: category.color }}>
              {category.label}
            </Typography>
            . Clicking an already-mapped category removes it.
          </Typography>
        </Box>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose} sx={{ color: 'text.secondary', ml: 1, flexShrink: 0 }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <DialogContent sx={{ px: 3, pt: 0, pb: 3 }}>
        {PLAID_CATEGORY_GROUPS.map((group) => {
          const items = PLAID_CATEGORIES.filter((c) => c.group === group)
          return (
            <Box key={group} sx={{ mb: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block', mb: 1,
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                {group}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {items.map(({ key, label }) => {
                  const isSelected = mappedToThis.has(key)
                  const otherOwner = ownedByOther.get(key)
                  const isLoading = busy === key

                  return (
                    <Tooltip
                      key={key}
                      title={otherOwner ? `Already mapped to "${otherOwner.label}" — clicking will move it here` : ''}
                      placement="top"
                    >
                      <Chip
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            {isLoading ? (
                              <CircularProgress size={10} color="inherit" />
                            ) : isSelected ? (
                              <CheckIcon sx={{ fontSize: 12 }} />
                            ) : null}
                            {label}
                            {otherOwner && !isSelected && (
                              <Box
                                component="span"
                                sx={{
                                  ml: 0.5,
                                  display: 'inline-flex',
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: otherOwner.color,
                                  flexShrink: 0,
                                  verticalAlign: 'middle',
                                }}
                              />
                            )}
                          </Box>
                        }
                        onClick={() => toggle(key)}
                        disabled={!!busy}
                        size="small"
                        sx={{
                          fontSize: 12,
                          fontWeight: isSelected ? 600 : 400,
                          cursor: busy ? 'wait' : 'pointer',
                          // Selected: filled with category color
                          bgcolor: isSelected
                            ? `${category.color}20`
                            : otherOwner
                            ? `${otherOwner.color}10`
                            : 'rgba(255,255,255,0.06)',
                          color: isSelected
                            ? category.color
                            : otherOwner
                            ? otherOwner.color
                            : 'text.secondary',
                          border: '1px solid',
                          borderColor: isSelected
                            ? `${category.color}55`
                            : otherOwner
                            ? `${otherOwner.color}33`
                            : 'divider',
                          '&:hover': {
                            bgcolor: isSelected ? `${category.color}30` : `${category.color}12`,
                            color: category.color,
                            borderColor: `${category.color}66`,
                          },
                          '& .MuiChip-label': { display: 'flex', alignItems: 'center' },
                        }}
                      />
                    </Tooltip>
                  )
                })}
              </Box>
            </Box>
          )
        })}

        {/* Legend */}
        <Box
          sx={{
            mt: 1, pt: 2, borderTop: '1px solid', borderColor: 'divider',
            display: 'flex', flexWrap: 'wrap', gap: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CheckIcon sx={{ fontSize: 12, color: category.color }} />
            <Typography variant="caption" color="text.secondary">Mapped to this category</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.3)' }} />
            <Typography variant="caption" color="text.secondary">Mapped to another category (click to move here)</Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  )
}
