import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, X, Check, Tag } from 'lucide-react'
import { useCategories } from '@/hooks/useCategories'
import { useTransactions } from '@/hooks/useTransactions'
import { Drawer } from '@/components/ui/Drawer'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/useToast'
import { fmt, cn } from '@/lib/utils'
import type { Category } from '@/types'

const SWATCH = ['#C4634A','#3A8880','#6B5FD4','#4E8E5C','#A87830','#C87AA8','#5B88C4','#8B6BD4','#4A9BA8','#B85450']

function TagForm({
  initial, onSave, onClose,
}: {
  initial?: Category; onSave: (d: { label: string; value: string; color: string }) => Promise<void>; onClose: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [color, setColor] = useState(initial?.color ?? SWATCH[0])
  const [saving, setSaving] = useState(false)
  const slug = label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')

  const handleSave = async () => {
    if (!label) return
    setSaving(true)
    try { await onSave({ label, value: initial?.value ?? (slug || `tag_${Date.now()}`), color }) }
    finally { setSaving(false) }
  }

  return (
    <div className="px-5 pb-6">
      <div className="flex items-center justify-between py-4 border-b border-brd mb-5">
        <p className="font-display font-bold text-[17px] text-ink">{initial ? 'Edit Tag' : 'New Tag'}</p>
        <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-card transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="mb-4">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">Name</p>
        <input
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder="e.g. Date nights"
          className="w-full px-3.5 py-3 rounded-xl bg-card border border-brd text-[15px] text-ink outline-none focus:border-accent placeholder:text-faint transition-colors"
        />
        {slug && !initial && <p className="text-[11px] text-faint mt-1.5 font-mono">{slug}</p>}
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-3">Color</p>
        <div className="flex gap-2.5 flex-wrap">
          {SWATCH.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="w-9 h-9 rounded-[10px] relative transition-all flex items-center justify-center"
              style={{
                background: c,
                outline: color === c ? `2.5px solid var(--ink)` : 'none',
                outlineOffset: 2,
              }}
            >
              {color === c && <Check size={13} className="text-white" strokeWidth={3} />}
            </button>
          ))}
        </div>
      </div>

      {/* Preview */}
      {label && (
        <div className="mb-5 px-3.5 py-3 rounded-xl flex items-center gap-3" style={{ background: `${color}14`, border: `1.5px solid ${color}40` }}>
          <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
          <span className="text-[14px] font-semibold text-ink">{label}</span>
        </div>
      )}

      <div className="flex gap-2.5">
        <button onClick={onClose} className="flex-1 py-3.5 rounded-[13px] bg-card border border-brd text-[14px] font-semibold text-muted">
          Cancel
        </button>
        <button
          disabled={!label || saving}
          onClick={handleSave}
          className="flex-[2] py-3.5 rounded-[13px] text-[14px] font-bold text-white disabled:opacity-40 transition-colors"
          style={{ background: 'var(--accent)' }}
        >
          {saving ? 'Saving…' : initial ? 'Save changes' : 'Create tag'}
        </button>
      </div>
    </div>
  )
}

export default function Tags() {
  const { categories, loading, create, update, remove } = useCategories()
  const { transactions } = useTransactions({})
  const { show, node: toastNode } = useToast()

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Category | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const stats = useMemo(() => {
    const m: Record<number, { count: number; total: number }> = {}
    transactions.filter((t) => t.custom_category_id && t.amount > 0).forEach((t) => {
      const id = t.custom_category_id!
      m[id] = m[id] ?? { count: 0, total: 0 }
      m[id].count++
      m[id].total += t.amount
    })
    return m
  }, [transactions])

  const totalTagged = useMemo(() => Object.values(stats).reduce((s, v) => s + v.total, 0), [stats])
  const totalTxns = useMemo(() => transactions.filter((t) => t.amount > 0).length, [transactions])
  const taggedTxns = useMemo(() => Object.values(stats).reduce((s, v) => s + v.count, 0), [stats])

  const openCreate = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (cat: Category) => { setEditing(cat); setFormOpen(true) }

  const handleSave = async (data: { label: string; value: string; color: string }) => {
    if (editing) { await update(editing.id, data); show('Tag updated') }
    else { await create(data); show('Tag created') }
    setFormOpen(false); setEditing(null)
  }

  const handleDelete = async (id: number) => {
    if (deleteConfirm === id) {
      await remove(id)
      setDeleteConfirm(null)
      show('Tag deleted')
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 3000)
    }
  }

  return (
    <div className="px-4 md:px-8 py-5 max-w-2xl mx-auto md:max-w-none">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[10px] font-bold text-muted uppercase tracking-[0.12em] mb-1">Organization</p>
          <h1 className="font-display font-extrabold text-[32px] text-ink leading-none tracking-tight">Tags</h1>
          <p className="text-[13px] text-muted mt-1.5">Your custom spending categories</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white mt-1"
          style={{ background: 'var(--accent)' }}
        >
          <Plus size={15} />
          New tag
        </button>
      </div>

      {/* Summary bar */}
      {categories.length > 0 && totalTxns > 0 && (
        <div className="bg-card rounded-xl border border-brd p-4 mb-5 grid grid-cols-3 divide-x divide-brd">
          <div className="pr-4">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] mb-1">Tags</p>
            <p className="text-[22px] font-bold text-ink">{categories.length}</p>
          </div>
          <div className="px-4">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] mb-1">Tagged</p>
            <p className="text-[22px] font-bold text-ink">{taggedTxns}<span className="text-[13px] font-medium text-muted ml-1">/ {totalTxns}</span></p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em] mb-1">Total</p>
            <p className="text-[22px] font-bold text-ink">{fmt(totalTagged)}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-card border border-brd flex items-center justify-center">
            <Tag size={28} className="text-muted" />
          </div>
          <div className="text-center">
            <p className="text-[16px] font-semibold text-ink mb-1">No tags yet</p>
            <p className="text-[13px] text-muted">Create tags to organize your spending your way</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[14px] font-semibold text-white"
            style={{ background: 'var(--accent)' }}
          >
            <Plus size={15} />
            Create your first tag
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {categories.map((cat) => {
            const s = stats[cat.id] ?? { count: 0, total: 0 }
            const confirmDel = deleteConfirm === cat.id
            const pct = totalTagged > 0 ? (s.total / totalTagged) * 100 : 0

            return (
              <div
                key={cat.id}
                className="bg-card rounded-xl border border-brd overflow-hidden"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Color swatch */}
                  <div
                    className="w-11 h-11 rounded-[13px] flex-shrink-0 flex items-center justify-center"
                    style={{ background: `${cat.color}20` }}
                  >
                    <div className="w-4 h-4 rounded-[5px]" style={{ background: cat.color }} />
                  </div>

                  {/* Label + stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-0.5">
                      <p className="text-[15px] font-semibold text-ink">{cat.label}</p>
                    </div>
                    <p className="text-[12px] text-muted">
                      {s.count > 0
                        ? `${s.count} transaction${s.count > 1 ? 's' : ''} · ${fmt(s.total)}`
                        : 'No transactions tagged'}
                    </p>
                  </div>

                  {/* Amount + actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {s.total > 0 && (
                      <span className="text-[13px] font-bold text-ink mr-2">{fmt(s.total)}</span>
                    )}
                    <button
                      onClick={() => openEdit(cat)}
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-ink hover:bg-card-b transition-colors"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
                        confirmDel ? 'bg-red/10 text-red' : 'text-muted hover:text-red hover:bg-red/10',
                      )}
                    >
                      {confirmDel ? <Check size={13} /> : <Trash2 size={13} />}
                    </button>
                  </div>
                </div>

                {/* Usage bar */}
                {s.count > 0 && (
                  <div className="h-[3px] bg-card-b mx-4 mb-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.max(pct, 3)}%`, background: cat.color }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Drawer open={formOpen} onClose={() => { setFormOpen(false); setEditing(null) }}>
        <TagForm
          initial={editing ?? undefined}
          onSave={handleSave}
          onClose={() => { setFormOpen(false); setEditing(null) }}
        />
      </Drawer>

      {toastNode}
    </div>
  )
}
