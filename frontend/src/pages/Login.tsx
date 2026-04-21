import { useState } from 'react'
import { NomiLogo } from '@/components/ui/NomiLogo'
import { Sheet } from '@/components/ui/Sheet'
import { cn } from '@/lib/utils'
import { signInWithGoogle } from '@/services/supabase'

function Commitment({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-sm flex-shrink-0" style={{ background: 'rgba(107,95,212,0.12)' }}>
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-semibold text-ink/80 mb-0.5">{title}</p>
        <p className="text-[12px] text-muted leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

export default function Login() {
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [privacyOpen, setPrivacyOpen] = useState(false)

  const handleSignIn = async () => {
    if (!agreed) return
    setLoading(true); setError(null)
    try { await signInWithGoogle() } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex items-center justify-center p-4 relative"
      style={{
        background: '#0C0C0A',
        paddingBottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {/* Ambient gradient */}
      <div className="fixed inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(107,95,212,0.18) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 80%, rgba(107,95,212,0.07) 0%, transparent 60%)',
      }} />

      <div className="relative w-full max-w-[400px] flex flex-col">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4 mb-9">
          <NomiLogo size={52} />
          <span className="font-display font-extrabold text-[28px] tracking-tight" style={{ color: '#EEEEE9' }}>nomi</span>
          <p className="text-[14px] text-center leading-relaxed max-w-[260px]" style={{ color: '#78786F', marginTop: -8 }}>
            Take control of your money. See exactly where it goes.
          </p>
        </div>

        {/* Privacy consent */}
        <button
          className="flex items-start gap-3 p-3.5 rounded-xl mb-5 text-left transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          onClick={() => setAgreed((v) => !v)}
        >
          <div
            className={cn(
              'w-[18px] h-[18px] rounded flex items-center justify-center flex-shrink-0 mt-0.5 transition-all',
              agreed ? 'bg-accent' : 'border border-white/20',
            )}
            style={{ borderRadius: 5 }}
          >
            {agreed && (
              <svg width="11" height="8" viewBox="0 0 11 8" fill="none">
                <path d="M1 4l3 3 6-6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="text-[13px] leading-relaxed flex-1" style={{ color: '#9A9A94' }}>
            I've read and agree to nomi's{' '}
            <span
              className="underline cursor-pointer"
              style={{ color: '#A098E0', textDecorationColor: 'rgba(160,152,224,0.4)' }}
              onClick={(e) => { e.stopPropagation(); setPrivacyOpen(true) }}
            >
              Privacy Policy
            </span>
            . nomi connects to your bank via Plaid and never sells your data.
          </p>
        </button>

        {/* Sign in button */}
        <button
          disabled={!agreed || loading}
          onClick={handleSignIn}
          className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-[13px] text-[15px] font-semibold text-white transition-opacity mb-4 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: '#6B5FD4' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="rgba(255,255,255,0.9)" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="rgba(255,255,255,0.75)" />
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="rgba(255,255,255,0.6)" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="rgba(255,255,255,0.85)" />
          </svg>
          {loading ? 'Signing in…' : 'Continue with Google'}
        </button>

        {error && <p className="text-[13px] text-red text-center mb-4">{error}</p>}

        <div className="h-px mb-5" style={{ background: 'rgba(255,255,255,0.08)' }} />

        {/* Commitments */}
        <div className="flex flex-col gap-3.5">
          <Commitment icon="🔒" title="End-to-end encrypted" desc="Your transactions are encrypted at rest and in transit using AES-256 and TLS 1.3." />
          <Commitment icon="🏛️" title="Row-level data isolation" desc="Your data is scoped to your user ID at the database layer — inaccessible to anyone else." />
          <Commitment icon="🚫" title="Never sold, never used for ads" desc="Your data is not used to build advertising profiles or sold to any third party." />
        </div>

        <p className="text-[11px] text-center mt-5 leading-relaxed" style={{ color: '#4A4A44' }}>
          nomi connects to your bank via <strong style={{ color: '#6A6A64' }}>Plaid</strong>, a regulated financial data provider.
          Nomi requests the minimum permissions required and never initiates payments on your behalf.
        </p>
      </div>

      {/* Privacy Policy Sheet */}
      <Sheet open={privacyOpen} onClose={() => setPrivacyOpen(false)}>
        <div className="px-5 pb-6">
          <div className="py-4 border-b border-brd mb-4">
            <p className="font-display font-extrabold text-[20px] text-ink tracking-tight">Privacy Policy</p>
            <p className="text-[12px] text-muted mt-0.5">Draft · not yet published</p>
          </div>
          {[
            { title: 'What we collect', body: 'We collect your name and email address when you sign in with Google. Through Plaid, we receive your transaction history, account balances, and institution names. We do not collect your bank credentials.' },
            { title: 'How we use it', body: 'Your data is used solely to power your personal dashboard — categorisation, insights, and spending summaries. It is never used for advertising, profiling, or any purpose other than providing the service to you.' },
            { title: 'Storage & security', body: 'Data is stored in a Postgres database with row-level security enforced at the database layer. All data is encrypted at rest (AES-256) and in transit (TLS 1.3).' },
            { title: 'Third parties', body: 'We use Plaid to connect to your bank and Google for authentication. We do not share your data with any other third parties and do not sell your data.' },
            { title: 'Your rights', body: 'You may request export or deletion of all your data at any time from account settings. Deletion is complete within 30 days.' },
            { title: 'Contact', body: 'Questions? Reach us at privacy@nomi.app' },
          ].map(({ title, body }) => (
            <div key={title} className="mb-5">
              <p className="text-[10px] font-bold text-muted uppercase tracking-widest mb-2">{title}</p>
              <p className="text-[13px] text-muted leading-relaxed">{body}</p>
            </div>
          ))}
          <button
            onClick={() => setPrivacyOpen(false)}
            className="w-full py-3.5 rounded-[13px] text-[15px] font-semibold text-white"
            style={{ background: '#6B5FD4' }}
          >
            Done
          </button>
        </div>
      </Sheet>
    </div>
  )
}
