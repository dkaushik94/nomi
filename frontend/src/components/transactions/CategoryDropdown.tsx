import {
  Box,
  CircularProgress,
  Divider,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Typography,
} from '@mui/material'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline'
import AddIcon from '@mui/icons-material/Add'
import { useState } from 'react'
import type { Category, Transaction } from '@/types'
import CategoryFormModal, { type CategoryFormData } from '@/components/categories/CategoryFormModal'

interface Props {
  transaction: Transaction
  categories: Category[]
  isNew: boolean
  onTag: (catId: number) => Promise<void>
  onClear: () => Promise<void>
  onDismiss: () => void
  onCreate: (data: CategoryFormData) => Promise<Category>
}

export default function CategoryDropdown({
  transaction,
  categories,
  isNew,
  onTag,
  onClear,
  onDismiss,
  onCreate,
}: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const directCat = categories.find((c) => c.id === transaction.custom_category_id)
  const open = !!anchorEl

  const handleOpen = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation()
    setAnchorEl(e.currentTarget)
  }

  const handleClose = () => setAnchorEl(null)

  const handleTag = async (catId: number) => {
    handleClose()
    setBusy(true)
    try {
      await onTag(catId)
    } finally {
      setBusy(false)
    }
  }

  const handleClear = async () => {
    handleClose()
    setBusy(true)
    try {
      await onClear()
    } finally {
      setBusy(false)
    }
  }

  const handleDismiss = () => {
    handleClose()
    onDismiss()
  }

  const handleOpenCreate = (e: React.MouseEvent) => {
    e.stopPropagation()
    handleClose()
    setCreateOpen(true)
  }

  // Create category then immediately tag the transaction with it
  const handleCreateAndTag = async (data: CategoryFormData): Promise<void> => {
    const newCat = await onCreate(data)
    await onTag(newCat.id)
  }

  // ── Trigger chip ────────────────────────────────────────────────────────────
  const trigger = busy ? (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', px: 1, py: 0.3, minWidth: 40 }}>
      <CircularProgress size={12} sx={{ color: 'primary.main' }} />
    </Box>
  ) : directCat ? (
    // Has a direct custom category — show as a styled chip
    <Box
      onClick={handleOpen}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.6,
        px: 1, py: 0.3, borderRadius: 1.5,
        bgcolor: `${directCat.color}18`,
        border: `1px solid ${directCat.color}44`,
        cursor: 'pointer',
        transition: 'opacity 0.15s',
        '&:hover': { opacity: 0.8 },
      }}
    >
      <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: directCat.color, flexShrink: 0 }} />
      <Typography variant="caption" noWrap sx={{ fontSize: 11, fontWeight: 600, color: directCat.color, lineHeight: 1.2, maxWidth: 130 }}>
        {directCat.label}
      </Typography>
    </Box>
  ) : (
    // No direct category — show a subtle "+ Add" prompt
    <Box
      onClick={handleOpen}
      sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.4,
        px: 0.75, py: 0.25, borderRadius: 1.5,
        color: 'text.disabled', cursor: 'pointer',
        border: '1px dashed transparent',
        '&:hover': { color: 'primary.main', borderColor: 'primary.main', bgcolor: 'rgba(15,196,181,0.06)' },
        transition: 'all 0.15s',
      }}
    >
      <AddIcon sx={{ fontSize: 13 }} />
      <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 500 }}>Add</Typography>
    </Box>
  )

  return (
    <>
      {trigger}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={(e) => e.stopPropagation()}
        slotProps={{
          paper: {
            elevation: 0,
            sx: {
              minWidth: 220,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              bgcolor: 'background.paper',
              mt: 0.5,
            },
          },
        }}
      >
        {/* ── Sticky: Create category ───────────────────────────────────────── */}
        <MenuItem
          onClick={handleOpenCreate}
          dense
          sx={{
            py: 1,
            color: 'primary.main',
            fontWeight: 600,
            position: 'sticky',
            top: 0,
            bgcolor: 'background.paper',
            zIndex: 1,
            '&:hover': { bgcolor: 'rgba(15,196,181,0.08)' },
          }}
        >
          <ListItemIcon sx={{ minWidth: 32 }}>
            <AddCircleOutlineIcon fontSize="small" sx={{ color: 'primary.main' }} />
          </ListItemIcon>
          <ListItemText primary="Create category" primaryTypographyProps={{ fontSize: 13, fontWeight: 600, color: 'primary.main' }} />
        </MenuItem>

        <Divider />

        {/* ── Category list ─────────────────────────────────────────────────── */}
        {categories.length === 0 ? (
          <MenuItem disabled dense>
            <ListItemText primary="No categories yet" primaryTypographyProps={{ fontSize: 12, color: 'text.disabled' }} />
          </MenuItem>
        ) : (
          categories.map((cat) => (
            <MenuItem
              key={cat.id}
              onClick={() => handleTag(cat.id)}
              dense
              selected={cat.id === transaction.custom_category_id}
              sx={{
                gap: 0.5,
                '&.Mui-selected': { bgcolor: `${cat.color}14` },
                '&.Mui-selected:hover': { bgcolor: `${cat.color}20` },
              }}
            >
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: cat.color, flexShrink: 0, mr: 1 }} />
              <ListItemText primary={cat.label} primaryTypographyProps={{ fontSize: 13 }} />
              {cat.id === transaction.custom_category_id && (
                <CheckCircleOutlineIcon sx={{ fontSize: 14, color: cat.color, ml: 'auto' }} />
              )}
            </MenuItem>
          ))
        )}

        {/* ── Remove (only if directly tagged) ─────────────────────────────── */}
        {transaction.custom_category_id && (
          <>
            <Divider />
            <MenuItem
              onClick={handleClear}
              dense
              sx={{ color: 'error.main', '&:hover': { bgcolor: 'rgba(240,68,56,0.06)' } }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <RemoveCircleOutlineIcon fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <ListItemText primary="Remove category" primaryTypographyProps={{ fontSize: 13 }} />
            </MenuItem>
          </>
        )}

        {/* ── Mark as reviewed (only for new transactions) ──────────────────── */}
        {isNew && (
          <>
            <Divider />
            <MenuItem
              onClick={handleDismiss}
              dense
              sx={{ color: 'success.main', '&:hover': { bgcolor: 'rgba(23,178,106,0.06)' } }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircleOutlineIcon fontSize="small" sx={{ color: 'success.main' }} />
              </ListItemIcon>
              <ListItemText
                primary="Looks good"
                secondary="Dismiss new highlight"
                primaryTypographyProps={{ fontSize: 13 }}
                secondaryTypographyProps={{ fontSize: 11 }}
              />
            </MenuItem>
          </>
        )}
      </Menu>

      {/* Category create modal — rendered outside menu so it survives menu close */}
      <CategoryFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreateAndTag}
      />
    </>
  )
}
