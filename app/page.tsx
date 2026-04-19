'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VintageBg } from '@/components/VintageBg'
import { Paper } from '@/components/Paper'
import { Dash } from '@/components/Dash'
import { ReceiptLabel } from '@/components/ReceiptLabel'
import { BigStamp } from '@/components/BigStamp'
import { InkBtn } from '@/components/InkBtn'
import { InkInput } from '@/components/InkInput'
import { INK, INK2, PAPER, DASH, GROUPS } from '@/lib/design'

type Tab = 'join' | 'host'

export default function HomePage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('join')

  const [code, setCode]   = useState('')
  const [name, setName]   = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [fact, setFact]   = useState('')
  const [factPrefilled, setFactPrefilled] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const lookupRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [hostName, setHostName]     = useState('')
  const [customCode, setCustomCode] = useState('')
  const [hosting, setHosting]       = useState(false)
  const [hostError, setHostError]   = useState('')

  const canJoin = code.length >= 3 && name.trim() && group && fact.trim().length > 5
  const canHost = hostName.trim().length > 1

  // Prefill fact lookup
  useEffect(() => {
    if (lookupRef.current) clearTimeout(lookupRef.current)
    if (!code.trim() || !name.trim() || !group) {
      if (factPrefilled) { setFact(''); setFactPrefilled(false) }
      return
    }
    lookupRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/${code.toUpperCase()}/lookup?name=${encodeURIComponent(name.trim())}&group=${group}`)
        if (res.ok) {
          const data = await res.json()
          if (data.fact) { setFact(data.fact); setFactPrefilled(true) }
          else if (factPrefilled) { setFact(''); setFactPrefilled(false) }
        }
      } catch {}
    }, 500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, name, group])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoinError('')
    setJoining(true)
    try {
      const res = await fetch(`/api/games/${code.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, group, fact }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Failed to join'); return }
      localStorage.setItem('pf_identity', JSON.stringify({
        playerId: data.playerId, playerToken: data.playerToken,
        playerName: name, playerGroup: group,
        gameCode: code.toUpperCase(), isHost: false,
      }))
      router.push(`/lobby/${code.toUpperCase()}`)
    } catch { setJoinError('Network error') }
    finally { setJoining(false) }
  }

  async function handleHost(e: React.FormEvent) {
    e.preventDefault()
    setHostError('')
    setHosting(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, customCode: customCode.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setHostError(data.error ?? 'Failed to create game'); return }
      localStorage.setItem('pf_identity', JSON.stringify({
        hostToken: data.hostToken, hostName, gameCode: data.code, isHost: true,
      }))
      router.push(`/setup/${data.code}`)
    } catch { setHostError('Network error') }
    finally { setHosting(false) }
  }

  return (
    <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '56px 12px 40px' }}>
      <VintageBg screen="home" />
      <Paper tilt={-0.6}>
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <BigStamp>FaceCard</BigStamp>
          <ReceiptLabel center>The party game · Est. 2025</ReceiptLabel>
        </div>
        <Dash />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, border: `2px solid ${INK}` }}>
          {(['join', 'host'] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1, padding: '10px 0', border: 'none',
              background: tab === t ? INK : 'transparent',
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700, fontSize: 12, letterSpacing: 1.5,
              textTransform: 'uppercase',
              color: tab === t ? PAPER : INK,
              cursor: 'pointer', transition: 'all 0.15s',
            }}>{t === 'join' ? 'Join Game' : 'Host Game'}</button>
          ))}
        </div>

        {tab === 'join' ? (
          <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InkInput label="Game code" value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="XKQP2" big />

            <InkInput label="Your name" value={name}
              onChange={e => setName(e.target.value)} placeholder="First name" />

            <div>
              <ReceiptLabel>Your group</ReceiptLabel>
              <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                {Object.entries(GROUPS).map(([k, g]) => {
                  const sel = group === k
                  return (
                    <button key={k} type="button" onClick={() => setGroup(k)} style={{
                      flex: 1, height: 56, border: `2px solid ${g.color}`,
                      background: sel ? g.color : 'transparent',
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: 28, color: sel ? PAPER : g.color,
                      cursor: 'pointer', transition: 'all 0.15s',
                      transform: sel ? 'scale(1.06)' : 'scale(1)',
                    }}>{k}</button>
                  )
                })}
              </div>
              {group && (
                <div style={{
                  marginTop: 6, fontFamily: "'Space Mono', monospace",
                  fontSize: 11, color: GROUPS[group].color, textAlign: 'center',
                  letterSpacing: 1.5, textTransform: 'uppercase',
                }}>You're on {GROUPS[group].defaultName}</div>
              )}
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <ReceiptLabel>Your unexpected fact</ReceiptLabel>
                {factPrefilled && <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#186A32', letterSpacing: 1 }}>PRE-FILLED ✓</span>}
              </div>
              <textarea value={fact} onChange={e => { setFact(e.target.value); setFactPrefilled(false) }}
                placeholder="Something nobody here knows about you…"
                rows={3}
                style={{
                  width: '100%', marginTop: 2, padding: '10px 12px',
                  background: 'transparent', border: `1.5px solid ${factPrefilled ? '#186A32' : DASH}`,
                  fontFamily: "'Space Mono', monospace", fontSize: 13, color: INK,
                  resize: 'none', lineHeight: 1.6,
                }} />
            </div>

            {joinError && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#8B1A1A' }}>{joinError}</div>}
            <Dash />
            <InkBtn type="submit" disabled={!canJoin || joining}>{joining ? 'Joining…' : 'Join →'}</InkBtn>
          </form>
        ) : (
          <form onSubmit={handleHost} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <InkInput label="Your name" value={hostName}
              onChange={e => setHostName(e.target.value)} placeholder="First name" />
            <div>
              <ReceiptLabel>Custom game code <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span></ReceiptLabel>
              <div style={{ marginTop: 6 }}>
                <input value={customCode}
                  onChange={e => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder="e.g. SAMS25"
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: 'transparent', border: `1.5px solid ${DASH}`,
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: 28, letterSpacing: 4, color: INK, textAlign: 'center',
                  }} />
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: INK2, marginTop: 4, letterSpacing: 0.5 }}>
                  3–8 LETTERS/NUMBERS · LEAVE BLANK TO AUTO-GENERATE
                </div>
              </div>
            </div>
            <div style={{ padding: '10px 12px', border: `1px dashed ${DASH}`, fontFamily: "'Space Mono', monospace", fontSize: 12, color: INK2, lineHeight: 1.6 }}>
              As host you run the show — you see the facts, control reveals, and advance rounds.
            </div>
            {hostError && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#8B1A1A' }}>{hostError}</div>}
            <Dash />
            <InkBtn type="submit" disabled={!canHost || hosting}>{hosting ? 'Creating…' : 'Create game →'}</InkBtn>
          </form>
        )}

        <Dash />
        <div style={{ textAlign: 'center', fontFamily: "'Caveat', cursive", fontSize: 18, color: INK2 }}>
          Thank you for playing!
        </div>
      </Paper>
    </main>
  )
}
