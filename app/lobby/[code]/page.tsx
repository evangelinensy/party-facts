'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { VintageBg } from '@/components/VintageBg'
import { Paper } from '@/components/Paper'
import { Dash } from '@/components/Dash'
import { ReceiptLabel } from '@/components/ReceiptLabel'
import { InkBtn } from '@/components/InkBtn'
import { GroupAvatar } from '@/components/GroupAvatar'
import { INK, INK2, DASH, GROUPS } from '@/lib/design'

type Identity = { isHost: boolean; hostToken?: string; playerToken?: string; gameCode: string }

function LobbyTile({ name, group, fresh, photo }: { name: string; group: string; fresh: boolean; photo?: string }) {
  const [vis, setVis] = useState(!fresh)
  useEffect(() => {
    if (fresh) { const t = setTimeout(() => setVis(true), 80); return () => clearTimeout(t) }
  }, [fresh])
  const color = GROUPS[group]?.color ?? '#999'
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      width: 72,
      opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(-6px)',
      transition: 'all 0.35s ease',
    }}>
      {photo ? (
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `2px solid ${color}`,
          overflow: 'hidden', flexShrink: 0, background: '#000',
        }}>
          <img src={photo} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ) : (
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          border: `2px solid ${color}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 26, color, flexShrink: 0,
        }}>{name[0]?.toUpperCase()}</div>
      )}
      <span style={{
        fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: INK,
        letterSpacing: 0.5, textAlign: 'center', lineHeight: 1.2,
        width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {name.toUpperCase()}
      </span>
    </div>
  )
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')
  const [prevCount, setPrevCount] = useState(0)

  useEffect(() => {
    const raw = localStorage.getItem('pf_identity')
    if (raw) setIdentity(JSON.parse(raw))
  }, [])

  // Background party music while waiting in the lobby. Stops when the page unmounts
  // (i.e. when the host starts the game or the player navigates away).
  useEffect(() => {
    if (typeof window === 'undefined') return
    const music = new Audio('/lobby-music.mp3')
    music.volume = 0.35
    music.loop = true
    music.play().catch(() => {})
    return () => { music.pause(); music.currentTime = 0 }
  }, [])

  const token = identity?.isHost ? identity.hostToken : identity?.playerToken
  const { data, error } = useGameState(code, token)

  useEffect(() => {
    if (data?.game.status === 'playing')  router.push(`/game/${code}`)
    if (data?.game.status === 'finished') router.push(`/social/${code}`)
  }, [data?.game.status, code, router])

  useEffect(() => {
    if (data) setPrevCount(data.players.length)
  }, [data?.players.length])

  async function handleStart() {
    setStartError('')
    setStarting(true)
    try {
      const res = await fetch(`/api/games/${code}/start`, {
        method: 'POST', headers: { Authorization: `Bearer ${identity?.hostToken}` },
      })
      const d = await res.json()
      if (!res.ok) { setStartError(d.error ?? 'Failed to start'); return }
      router.push(`/game/${code}`)
    } catch { setStartError('Network error') }
    finally { setStarting(false) }
  }

  if (error) return <Screen><p style={{ fontFamily: "'Space Mono', monospace", color: '#8B1A1A', fontSize: 12 }}>{error}</p></Screen>
  if (!data)  return <Screen><p style={{ fontFamily: "'Space Mono', monospace", color: INK2, fontSize: 12 }}>Loading…</p></Screen>

  const { game, players } = data
  const byGroup = Object.entries(GROUPS).map(([k, g]) => ({
    letter: k, color: g.color,
    displayName: game.groupNames?.[k] || g.defaultName,
    members: players.filter(p => p.groupLetter === k),
  })).filter(g => g.members.length > 0)

  return (
    <Screen>
      <Paper tilt={0.4}>
        <div style={{ textAlign: 'center' }}>
          <ReceiptLabel center>Game code</ReceiptLabel>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 72, lineHeight: 1, color: INK, letterSpacing: 10, margin: '4px 0 2px' }}>
            {code}
          </div>
          <ReceiptLabel center>{players.length} player{players.length !== 1 ? 's' : ''} joined</ReceiptLabel>
        </div>
        <Dash />

        {byGroup.map(({ letter, color, displayName, members }) => (
          <div key={letter} style={{ marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ flex: '0 0 10px', height: 2, background: color }} />
              <span style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color,
                letterSpacing: 3, textTransform: 'uppercase',
              }}>{displayName}</span>
              <span style={{
                fontFamily: "'Space Mono', monospace", fontSize: 10, color: INK2, letterSpacing: 1,
              }}>({members.length})</span>
              <div style={{ flex: 1, height: 2, background: color, opacity: 0.3 }} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-start' }}>
              {members.map((p, i) => (
                <LobbyTile key={p.id} name={p.name} group={p.groupLetter} photo={p.photo} fresh={i === members.length - 1 && players.length > prevCount} />
              ))}
            </div>
          </div>
        ))}

        {players.length === 0 && (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: INK2, textAlign: 'center', padding: '12px 0' }}>
            No players yet…
          </div>
        )}

        <Dash />
        {identity?.isHost ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <InkBtn onClick={handleStart} disabled={starting}>{starting ? 'Starting…' : 'Start game →'}</InkBtn>
            {startError && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#8B1A1A', textAlign: 'center' }}>{startError}</div>}
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: INK2, textAlign: 'center', letterSpacing: 1, textTransform: 'uppercase' }}>
              Need at least 2 different groups
            </div>
            <button onClick={() => router.push(`/setup/${code}`)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2,
              letterSpacing: 1, textTransform: 'uppercase', paddingTop: 4,
            }}>← Back to setup</button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '12px 0' }}>
            <div style={{ width: 8, height: 8, background: INK2, animation: 'pulse 1.5s infinite' }} />
            <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: INK2, letterSpacing: 1 }}>
              WAITING FOR HOST…
            </span>
          </div>
        )}
      </Paper>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '56px 12px 40px' }}>
      <VintageBg screen="lobby" />
      {children}
    </main>
  )
}
