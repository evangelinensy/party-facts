'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VintageBg } from '@/components/VintageBg'
import { Paper } from '@/components/Paper'
import { Dash } from '@/components/Dash'
import { ReceiptLabel } from '@/components/ReceiptLabel'
import { BigStamp } from '@/components/BigStamp'
import { InkBtn } from '@/components/InkBtn'
import { INK, INK2, DASH } from '@/lib/design'

type Identity = { isHost: boolean; playerToken?: string; playerId?: string; gameCode: string }

export default function SocialPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [instagram, setInstagram] = useState('')
  const [telegram, setTelegram] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('pf_identity')
    if (raw) setIdentity(JSON.parse(raw))
  }, [])

  async function handleSubmit() {
    if (!identity || identity.isHost) { router.push(`/leaderboard/${code}`); return }
    setSaving(true)
    try {
      await fetch(`/api/games/${code}/social`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${identity.playerToken}` },
        body: JSON.stringify({ instagram, telegram }),
      })
    } finally {
      setSaving(false)
      router.push(`/leaderboard/${code}`)
    }
  }

  if (!identity) return (
    <Screen>
      <p style={{ fontFamily: "'Space Mono', monospace", color: INK2, fontSize: 12 }}>Loading…</p>
    </Screen>
  )

  if (identity.isHost) {
    router.push(`/leaderboard/${code}`)
    return null
  }

  return (
    <Screen>
      <Paper tilt={-0.4}>
        <div style={{ textAlign: 'center', marginBottom: 4 }}>
          <BigStamp>Connect</BigStamp>
          <ReceiptLabel center>Share your handles</ReceiptLabel>
        </div>
        <Dash />

        <div style={{ padding: '10px 12px', border: `1px dashed ${DASH}`, fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2, lineHeight: 1.6, marginBottom: 16 }}>
          Let other players find you after the game. Totally optional — skip if you'd rather not.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <ReceiptLabel>Instagram</ReceiptLabel>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 6, border: `1.5px solid ${DASH}`, background: 'transparent' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: INK2, padding: '10px 0 10px 12px' }}>@</span>
              <input
                value={instagram}
                onChange={e => setInstagram(e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                style={{
                  flex: 1, padding: '10px 12px 10px 4px',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: "'Space Mono', monospace", fontSize: 14, color: INK,
                }}
              />
            </div>
          </div>

          <div>
            <ReceiptLabel>Telegram</ReceiptLabel>
            <div style={{ display: 'flex', alignItems: 'center', marginTop: 6, border: `1.5px solid ${DASH}`, background: 'transparent' }}>
              <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, color: INK2, padding: '10px 0 10px 12px' }}>@</span>
              <input
                value={telegram}
                onChange={e => setTelegram(e.target.value.replace(/^@/, ''))}
                placeholder="yourhandle"
                style={{
                  flex: 1, padding: '10px 12px 10px 4px',
                  background: 'transparent', border: 'none', outline: 'none',
                  fontFamily: "'Space Mono', monospace", fontSize: 14, color: INK,
                }}
              />
            </div>
          </div>
        </div>

        <Dash />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InkBtn onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'See leaderboard →'}
          </InkBtn>
          <button onClick={() => router.push(`/leaderboard/${code}`)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2,
            letterSpacing: 1, textTransform: 'uppercase', paddingTop: 4, textAlign: 'center',
          }}>Skip →</button>
        </div>
      </Paper>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '56px 12px 40px' }}>
      <VintageBg screen="social" />
      {children}
    </main>
  )
}
