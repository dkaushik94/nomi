import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'
import { useState, useEffect } from 'react'
import type { Category } from '@/types'

export interface CategoryFormData {
  label: string
  value: string
  color: string
}

const DEFAULT_FORM: CategoryFormData = { label: '', value: '', color: '#0fc4b5' }

const PRESET_COLORS = [
  '#0fc4b5', '#c9a227', '#6366f1', '#ec4899',
  '#f97316', '#22c55e', '#3b82f6', '#a855f7',
  '#ef4444', '#14b8a6', '#f59e0b', '#64748b',
]

interface Props {
  open: boolean
  onClose: () => void
  /** Pass a category to enter edit mode; omit for create mode */
  editing?: Category | null
  /** Called with the form data when the user saves; should return after the API call */
  onSave: (data: CategoryFormData) => Promise<void>
}

export default function CategoryFormModal({ open, onClose, editing, onSave }: Props) {
  const [form, setForm] = useState<CategoryFormData>(DEFAULT_FORM)
  const [saving, setSaving] = useState(false)

  // Sync form when editing target changes
  useEffect(() => {
    if (open) {
      setForm(editing ? { label: editing.label, value: editing.value, color: editing.color } : DEFAULT_FORM)
    }
  }, [open, editing])

  const handleLabelChange = (label: string) => {
    const autoValue = label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    setForm((f) => ({ ...f, label, value: editing ? f.value : autoValue }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, border: '1px solid', borderColor: 'divider' } }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>
          {editing ? 'Edit Category' : 'New Category'}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>
          {editing ? "Update this category's name or color." : 'Give your category a name and pick a color.'}
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ pt: '8px !important' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <TextField
            label="Label"
            size="small"
            fullWidth
            value={form.label}
            onChange={(e) => handleLabelChange(e.target.value)}
            placeholder="e.g. Groceries"
            autoFocus
          />
          <TextField
            label="Value (identifier)"
            size="small"
            fullWidth
            value={form.value}
            onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
            placeholder="e.g. groceries"
            helperText="Lowercase slug used internally"
          />

          {/* Color picker */}
          <Box>
            <Typography variant="body2" fontWeight={500} mb={1.25}>Color</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {PRESET_COLORS.map((c) => (
                <Box
                  key={c}
                  onClick={() => setForm((f) => ({ ...f, color: c }))}
                  sx={{
                    width: 28, height: 28, borderRadius: '8px', bgcolor: c,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: form.color === c ? '2px solid white' : '2px solid transparent',
                    boxShadow: form.color === c ? `0 0 0 2px ${c}` : 'none',
                    transition: 'transform 0.1s',
                    '&:hover': { transform: 'scale(1.15)' },
                  }}
                >
                  {form.color === c && <CheckIcon sx={{ fontSize: 14, color: '#000', opacity: 0.7 }} />}
                </Box>
              ))}
            </Box>

            {/* Preview */}
            <Box
              sx={{
                mt: 2, p: 1.5, borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.03)',
                border: '1px solid', borderColor: 'divider',
                display: 'flex', alignItems: 'center', gap: 1.5,
              }}
            >
              <Box
                sx={{
                  width: 28, height: 28, borderRadius: '8px',
                  bgcolor: `${form.color}22`, border: `1.5px solid ${form.color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: form.color }} />
              </Box>
              <Box>
                <Typography variant="body2" fontWeight={600}>{form.label || 'Category name'}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                  {form.value || 'value'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving || !form.label || !form.value}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, minWidth: 80 }}
        >
          {saving ? <CircularProgress size={16} color="inherit" /> : (editing ? 'Update' : 'Create')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
