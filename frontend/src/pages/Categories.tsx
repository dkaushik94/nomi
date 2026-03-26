import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  Grid,
  IconButton,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import { useState } from 'react'
import { useCategories } from '@/hooks/useCategories'
import { usePlaidMappings } from '@/hooks/usePlaidMappings'
import CategoryFormModal from '@/components/categories/CategoryFormModal'
import PlaidMappingEditor from '@/components/categories/PlaidMappingEditor'
import { PLAID_CATEGORIES } from '@/constants/plaidCategories'
import type { Category } from '@/types'

export default function Categories() {
  const { categories, loading, error, create, update, remove } = useCategories()
  const { mappings, assign, unassign } = usePlaidMappings()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)

  const [mappingTarget, setMappingTarget] = useState<Category | null>(null)

  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (cat: Category) => { setEditing(cat); setFormOpen(true) }

  const handleSave = async (form: { label: string; value: string; color: string }) => {
    if (editing) await update(editing.id, form)
    else await create(form)
  }

  const handleDelete = async (id: number) => {
    if (deleteConfirm === id) {
      await remove(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  // Plaid category label lookup
  const plaidLabel = (key: string) =>
    PLAID_CATEGORIES.find((c) => c.key === key)?.label ?? key.replace(/_/g, ' ')

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Categories</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Custom labels to organize your spending
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, px: 2.5 }}
        >
          New Category
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', pt: 8 }}><CircularProgress /></Box>
      ) : categories.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 10, border: '1px dashed', borderColor: 'divider', borderRadius: 3 }}>
          <Typography variant="h6" color="text.secondary" mb={1}>No categories yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Create categories to tag and organize your transactions
          </Typography>
          <Button variant="outlined" startIcon={<AddIcon />} onClick={openCreate} sx={{ textTransform: 'none' }}>
            Create your first category
          </Button>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {categories.map((cat) => {
            const catMappings = mappings.filter((m) => m.custom_category_id === cat.id)

            return (
              <Grid item xs={12} sm={6} md={4} key={cat.id}>
                <Card
                  elevation={0}
                  sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: 2.5,
                    p: 2.5, position: 'relative', overflow: 'hidden',
                    transition: 'border-color 0.15s',
                    '&:hover': { borderColor: cat.color },
                    '&::before': {
                      content: '""', position: 'absolute', top: 0, left: 0, right: 0,
                      height: 3, bgcolor: cat.color,
                    },
                  }}
                >
                  {/* Card header */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 36, height: 36, borderRadius: '10px',
                          bgcolor: `${cat.color}22`, border: `1.5px solid ${cat.color}55`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: cat.color }} />
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{cat.label}</Typography>
                        <Typography
                          variant="caption" color="text.secondary"
                          sx={{ fontFamily: 'monospace', bgcolor: 'rgba(255,255,255,0.04)', px: 0.75, py: 0.25, borderRadius: 0.75, display: 'inline-block', mt: 0.25 }}
                        >
                          {cat.value}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Action buttons */}
                    <Box sx={{ display: 'flex', gap: 0.5, ml: 1, flexShrink: 0 }}>
                      <Tooltip title="Map Plaid categories">
                        <IconButton
                          size="small"
                          onClick={() => setMappingTarget(cat)}
                          sx={{
                            opacity: catMappings.length > 0 ? 0.9 : 0.5,
                            color: catMappings.length > 0 ? cat.color : 'text.secondary',
                            '&:hover': { opacity: 1, color: cat.color },
                          }}
                        >
                          <AccountTreeOutlinedIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(cat)} sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                          <EditIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={deleteConfirm === cat.id ? 'Click again to confirm' : 'Delete'}>
                        <IconButton
                          size="small"
                          color={deleteConfirm === cat.id ? 'error' : 'default'}
                          onClick={() => handleDelete(cat.id)}
                          sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}
                        >
                          <DeleteIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  {/* Plaid mapping chips */}
                  {catMappings.length > 0 && (
                    <Box sx={{ mt: 1.75, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: 600 }}>
                        Plaid groups
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.75 }}>
                        {catMappings.map((m) => (
                          <Box
                            key={m.plaid_category}
                            sx={{
                              display: 'inline-flex', alignItems: 'center', gap: 0.5,
                              px: 0.75, py: 0.25, borderRadius: 1,
                              bgcolor: `${cat.color}14`, border: `1px solid ${cat.color}33`,
                            }}
                          >
                            <Box sx={{ width: 5, height: 5, borderRadius: '50%', bgcolor: cat.color }} />
                            <Typography variant="caption" sx={{ fontSize: 10.5, fontWeight: 500, color: cat.color }}>
                              {plaidLabel(m.plaid_category)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Empty state for mappings */}
                  {catMappings.length === 0 && (
                    <Box
                      onClick={() => setMappingTarget(cat)}
                      sx={{
                        mt: 1.5, pt: 1.25, borderTop: '1px solid', borderColor: 'divider',
                        display: 'flex', alignItems: 'center', gap: 0.75, cursor: 'pointer',
                        opacity: 0.5, '&:hover': { opacity: 1 },
                      }}
                    >
                      <AccountTreeOutlinedIcon sx={{ fontSize: 13, color: 'text.secondary' }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                        No Plaid categories mapped — click to add
                      </Typography>
                    </Box>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      )}

      <CategoryFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        editing={editing}
        onSave={handleSave}
      />

      {mappingTarget && (
        <PlaidMappingEditor
          open={!!mappingTarget}
          onClose={() => setMappingTarget(null)}
          category={mappingTarget}
          allMappings={mappings}
          allCategories={categories}
          onAssign={assign}
          onUnassign={unassign}
        />
      )}
    </Box>
  )
}
