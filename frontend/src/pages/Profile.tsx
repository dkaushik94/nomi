import { useState, useCallback } from 'react'
import { Link2, Link2Off, RefreshCw, LogOut, ShieldCheck, Trash2, Mail, Calendar, BadgeCheck } from 'lucide-react'
import { usePlaidLink } from 'react-plaid-link'
import { useAuth } from '@/context/AuthContext'
import { getLinkToken, linkAccount, syncTransactions, unlinkAccount, deleteAccount } from '@/services/api'
import { useToast } from '@/components/ui/useToast'
import { Spinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

function getDisplayName(email: string) {
  return email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function InfoRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-card-b flex items-center justify-center flex-shrink-0 text-muted">
        <Icon size={15} />
      </div>
      <div>
        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{label}</p>
        <p className="text-[14px] font-medium text-ink">{value}</p>
      </div>
    </div>
  )
}

export default function Profile() {
  const { user, logout, refreshUser } = useAuth()
  const { show, node: toastNode } = useToast()
  const [syncing, setSyncing] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [linkToken, setLinkToken] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)

  const fetchLinkToken = useCallback(async () => {
    if (linkToken) return
    try { const t = await getLinkToken(); setLinkToken(t) } catch { /* ignore */ }
  }, [linkToken])

  const { open: openPlaid, ready } = usePlaidLink({
    token: linkToken ?? '',
    onSuccess: async (publicToken, meta) => {
      try {
        await linkAccount(publicToken, { institution_id: meta.institution?.institution_id ?? null, institution_name: meta.institution?.name ?? null })
        await refreshUser()
        show('Bank linked successfully!')
      } catch (e) { show(e instanceof Error ? e.message : 'Link failed') }
    },
  })

  const handleSync = async () => {
    setSyncing(true)
    try {
      const r = await syncTransactions()
      show(`Synced — ${r.added} new, ${r.modified} updated, ${r.removed} removed`)
    } catch (e) { show(e instanceof Error ? e.message : 'Sync failed') }
    finally { setSyncing(false) }
  }

  const handleUnlink = async () => {
    if (!unlinking) { setUnlinking(true); return }
    try {
      await unlinkAccount()
      await refreshUser()
      show('Bank unlinked')
    } catch (e) { show(e instanceof Error ? e.message : 'Unlink failed') }
    finally { setUnlinking(false) }
  }

  const handleDeleteAccount = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); setTimeout(() => setDeleteConfirm(false), 5000); return }
    setDeleting(true)
    try { await deleteAccount(); await logout() } catch (e) { show(e instanceof Error ? e.message : 'Delete failed'); setDeleting(false) }
  }

  if (!user) return null

  const isLinked = !!user.plaid_item_id
  const memberSince = new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="px-4 md:px-8 py-5 max-w-lg mx-auto">
      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div
          className="w-[72px] h-[72px] rounded-2xl flex items-center justify-center mb-3 font-display font-extrabold text-[28px] text-white"
          style={{ background: 'var(--accent)' }}
        >
          {user.email[0].toUpperCase()}
        </div>
        <p className="font-display font-bold text-[20px] text-ink tracking-tight">{getDisplayName(user.email)}</p>
        {user.is_admin && (
          <span className="mt-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: 'var(--accent)/10', color: 'var(--accent)' }}>
            Admin
          </span>
        )}
      </div>

      {/* Info card */}
      <div className="bg-card rounded-xl border border-brd p-4 mb-4 flex flex-col gap-4">
        <InfoRow icon={Mail} label="Email" value={user.email} />
        <div className="h-px bg-brd" />
        <InfoRow icon={Calendar} label="Member since" value={memberSince} />
        {user.is_admin && (
          <>
            <div className="h-px bg-brd" />
            <InfoRow icon={BadgeCheck} label="Role" value="Administrator" />
          </>
        )}
      </div>

      {/* Bank connection card */}
      <div className="bg-card rounded-xl border border-brd p-4 mb-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-card-b flex items-center justify-center text-muted">
            <Link2 size={15} />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Bank Connection</p>
            {isLinked ? (
              <p className="text-[14px] font-semibold text-ink">{user.institution_name ?? 'Linked via Plaid'}</p>
            ) : (
              <p className="text-[14px] font-medium text-muted">Not connected</p>
            )}
          </div>
          <div
            className={cn('w-2 h-2 rounded-full', isLinked ? 'bg-green-500' : 'bg-faint')}
          />
        </div>

        <div className="flex flex-col gap-2">
          {isLinked ? (
            <>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent/10 text-accent text-[14px] font-semibold transition-opacity disabled:opacity-50"
              >
                <RefreshCw size={15} className={syncing ? 'animate-spin' : ''} />
                {syncing ? 'Syncing…' : 'Sync transactions'}
              </button>
              <button
                onClick={handleUnlink}
                className={cn(
                  'flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-semibold transition-colors text-red',
                  unlinking ? 'bg-red/10 border border-red/20' : 'hover:bg-red/10',
                )}
              >
                <Link2Off size={15} />
                {unlinking ? 'Tap again to confirm unlink' : 'Unlink bank'}
              </button>
            </>
          ) : (
            <button
              onMouseEnter={fetchLinkToken}
              onClick={() => { fetchLinkToken().then(() => { if (ready) openPlaid() }) }}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity"
              style={{ background: 'var(--accent)' }}
            >
              <Link2 size={15} />
              Connect bank via Plaid
            </button>
          )}
        </div>
      </div>

      {/* Privacy & security */}
      <div className="bg-card rounded-xl border border-brd p-4 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={15} className="text-muted" />
          <p className="text-[12px] font-bold text-muted uppercase tracking-widest">Privacy & Security</p>
        </div>
        <p className="text-[13px] text-muted leading-relaxed">
          Your data is encrypted at rest (AES-256) and in transit (TLS 1.3). Row-level security ensures your transactions are only accessible to you.
          You can request full data deletion below.
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <button
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-card border border-brd text-[14px] font-semibold text-muted hover:text-ink transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>

        <button
          onClick={handleDeleteAccount}
          disabled={deleting}
          className={cn('flex items-center justify-center gap-2 w-full py-3 rounded-xl text-[14px] font-semibold transition-colors', deleteConfirm ? 'bg-red/10 text-red border border-red/20' : 'text-red/60 hover:text-red')}
        >
          {deleting ? <Spinner className="w-4 h-4" /> : <Trash2 size={15} />}
          {deleteConfirm ? 'Tap again to permanently delete account' : 'Delete account & data'}
        </button>
      </div>

      {toastNode}
    </div>
  )
}
