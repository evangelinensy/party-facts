'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameState, GameState } from '@/hooks/useGameState'
import { VintageBg } from '@/components/VintageBg'
import { Paper } from '@/components/Paper'
import { Dash } from '@/components/Dash'
import { ReceiptLabel } from '@/components/ReceiptLabel'
import { BigStamp } from '@/components/BigStamp'
import { InkBtn } from '@/components/InkBtn'
import { GroupAvatar } from '@/components/GroupAvatar'
import { Timer } from '@/components/Timer'
import { INK, INK2, DASH, PAPER, GROUPS, CORRECT, WRONG } from '@/lib/design'
import { Player } from '@/lib/types'

type Identity = { isHost: boolean; hostToken?: string; playerToken?: string; playerId?: string; playerGroup?: string; gameCode: string }

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [hostRevealed, setHostRevealed] = useState(false)
  const prevRoundKey = useRef('')

  useEffect(() => {
    const raw = localStorage.getItem('pf_identity')
    if (raw) setIdentity(JSON.parse(raw))
  }, [])

  const token = identity?.isHost ? identity.hostToken : identity?.playerToken
  const { data, error, refetch } = useGameState(code, token)

  useEffect(() => {
    if (!data) return
    if (data.game.status === 'finished') { router.push(`/social/${code}`); return }
    const rk = `${data.game.currentGroupIdx}_${data.game.currentFactIdx}`
    if (rk !== prevRoundKey.current) {
      prevRoundKey.current = rk
      setSelected(null)
      setSubmitted(false)
      setHostRevealed(false)
    }
    if (data.myGuess) setSubmitted(true)
  }, [data, code, router])

  async function handleReveal() {
    await fetch(`/api/games/${code}/reveal`, { method: 'POST', headers: { Authorization: `Bearer ${identity?.hostToken}` } })
    setHostRevealed(true)
    refetch()
  }

  async function handleAdvance() {
    await fetch(`/api/games/${code}/advance`, { method: 'POST', headers: { Authorization: `Bearer ${identity?.hostToken}` } })
    setHostRevealed(false)
    refetch()
  }

  async function handleGuess() {
    if (selected === null || submitting) return
    setSubmitting(true)
    try {
      await fetch(`/api/games/${code}/guess`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${identity?.playerToken}` },
        body: JSON.stringify({ guessedPlayerId: selected }),
      })
      setSubmitted(true)
      refetch()
    } finally { setSubmitting(false) }
  }

  if (error) return <Screen bg="audience"><p style={{ fontFamily: "'Space Mono', monospace", color: '#8B1A1A', fontSize: 12 }}>{error}</p></Screen>
  if (!data || !identity) return <Screen bg="audience"><p style={{ fontFamily: "'Space Mono', monospace", color: INK2, fontSize: 12 }}>Loading…</p></Screen>

  const { game, onStagePlayers, guessCount, totalAudience, currentFact } = data
  const currentGroup = game.groupOrder[game.currentGroupIdx]
  const groupColor   = GROUPS[currentGroup]?.color ?? INK
  const groupName    = game.groupNames?.[currentGroup] || GROUPS[currentGroup]?.defaultName || `Group ${currentGroup}`
  const timerKey     = `${game.currentGroupIdx}_${game.currentFactIdx}`
  const factCount    = onStagePlayers.length
  const isHost       = identity.isHost
  const isOnStage    = !isHost && identity.playerGroup === currentGroup

  if (isHost) return (
    <Screen bg="host">
      <Paper tilt={0.3}>
        <div style={{ textAlign: 'center' }}>
          <BigStamp>Host View</BigStamp>
          <GroupStamp color={groupColor} label={`${groupName} — Fact ${game.currentFactIdx + 1} of ${factCount}`} />
        </div>
        <Dash />
        <ReceiptLabel>Current fact — host only</ReceiptLabel>
        <div style={{ margin: '8px 0', padding: '12px', background: '#7A3A0810', border: '1.5px solid #7A3A08' }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: '#5A2A04', lineHeight: 1.55 }}>
            {onStagePlayers[game.currentFactIdx]?.fact ?? '—'}
          </div>
          <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2 }}>
            → BELONGS TO: <strong style={{ color: INK }}>{onStagePlayers[game.currentFactIdx]?.name?.toUpperCase()}</strong>
          </div>
        </div>
        <Dash />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <ReceiptLabel>Guesses received</ReceiptLabel>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, color: INK, letterSpacing: 2 }}>{guessCount} / {totalAudience}</span>
        </div>
        <div style={{ height: 4, background: DASH }}>
          <div style={{ height: '100%', background: INK, width: `${totalAudience > 0 ? (guessCount / totalAudience) * 100 : 0}%`, transition: 'width 0.5s' }} />
        </div>
        <Dash />
        <InkBtn onClick={handleReveal} disabled={game.roundRevealed}>{game.roundRevealed ? '✓ Answers revealed' : 'Reveal answers'}</InkBtn>
        {game.roundRevealed && (
          <div style={{ marginTop: 12, padding: '12px 14px', border: `2px solid ${CORRECT}`, background: `${CORRECT}10`, animation: 'slideUp 0.3s ease' }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: CORRECT, letterSpacing: 2 }}>Round Result</div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: INK, marginTop: 4, lineHeight: 1.6 }}>
              Fact belonged to <strong>{onStagePlayers[game.currentFactIdx]?.name}</strong>
            </div>
          </div>
        )}
        <div style={{ marginTop: 10 }}>
          <InkBtn onClick={handleAdvance} outline={!game.roundRevealed} disabled={!game.roundRevealed}>Next fact →</InkBtn>
        </div>
      </Paper>
    </Screen>
  )

  if (isOnStage) return (
    <Screen bg="onstage">
      <Paper tilt={-0.8}>
        <div style={{ textAlign: 'center' }}>
          <GroupStamp color={groupColor} label={`${groupName} — On Stage`} />
          <ReceiptLabel center>Fact {game.currentFactIdx + 1} of {factCount}</ReceiptLabel>
          <ProgressDots total={factCount} current={game.currentFactIdx} />
        </div>
        <Dash />
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <ReceiptLabel center>Time Remaining</ReceiptLabel>
          <Timer resetKey={timerKey} />
          <ReceiptLabel center>seconds</ReceiptLabel>
        </div>
        <Dash />
        <ReceiptLabel>Your team on stage</ReceiptLabel>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {onStagePlayers.map((p, i) => {
            const active = i === game.currentFactIdx
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px',
                background: active ? `${groupColor}15` : 'transparent',
                border: active ? `2px solid ${groupColor}` : `1px dashed ${DASH}`,
                transition: 'all 0.3s',
              }}>
                <GroupAvatar initial={p.name[0]} color={groupColor} size={30} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: INK, letterSpacing: 0.5 }}>{p.name.toUpperCase()}</div>
                  {active && <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: groupColor, letterSpacing: 1 }}>● ACTIVE FACT</div>}
                </div>
              </div>
            )
          })}
        </div>
        <Dash />
        <div style={{ padding: '8px 10px', border: `1px dashed ${DASH}`, fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2, lineHeight: 1.6, textAlign: 'center', letterSpacing: 0.5 }}>
          ANSWER QUESTIONS HONESTLY<br />THE AUDIENCE IS GUESSING YOUR FACT
        </div>
        {game.roundRevealed && (
          <div style={{ marginTop: 12, padding: '10px 12px', border: `1.5px solid ${groupColor}`, background: `${groupColor}10`, textAlign: 'center' }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: INK2 }}>Fact revealed!</div>
          </div>
        )}
      </Paper>
    </Screen>
  )

  // Audience
  const correctId = game.roundRevealed ? onStagePlayers[game.currentFactIdx]?.id : null

  function btnStyle(p: Player) {
    const isSel   = selected === p.id
    const isOwner = p.id === correctId
    const locked  = submitted || game.roundRevealed
    if (game.roundRevealed && isOwner)           return { border: `2px solid ${CORRECT}`, bg: `${CORRECT}15`, label: 'CORRECT ✓', labelColor: CORRECT }
    if (game.roundRevealed && isSel && !isOwner) return { border: `2px solid ${WRONG}`,   bg: `${WRONG}15`,   label: 'WRONG ✗',   labelColor: WRONG }
    if (isSel)                                   return { border: `2px solid ${INK}`,      bg: `${INK}08`,     label: null,        labelColor: INK }
    return { border: `1.5px dashed ${DASH}`, bg: 'transparent', label: null, labelColor: INK }
  }

  return (
    <Screen bg="audience">
      <Paper tilt={0.5}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <GroupStamp color={groupColor} label={`${groupName} on stage`} small />
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, color: INK, lineHeight: 1, letterSpacing: 2 }}>
            <Timer resetKey={timerKey} />
          </div>
        </div>
        <Dash />

        <div>
          <ReceiptLabel>The fact</ReceiptLabel>
          <div style={{ margin: '8px 0 0', padding: '14px 12px', border: `2px solid ${INK}`, background: `${INK}05` }}>
            {game.roundRevealed && currentFact ? (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: INK, lineHeight: 1.55 }}>{currentFact}</div>
            ) : (
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 13, color: INK2, lineHeight: 1.55 }}>Who said this? Pick the person below.</div>
            )}
          </div>
        </div>
        <Dash />

        <ReceiptLabel>Whose fact is this?</ReceiptLabel>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {onStagePlayers.map(p => {
            const s = btnStyle(p)
            return (
              <button key={p.id} onClick={() => !(submitted || game.roundRevealed) && setSelected(p.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px',
                  background: s.bg, border: s.border,
                  cursor: (submitted || game.roundRevealed) ? 'default' : 'pointer',
                  transition: 'all 0.25s', width: '100%', textAlign: 'left',
                }}>
                <GroupAvatar initial={p.name[0]} color={groupColor} size={32} />
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 14, fontWeight: 700, color: INK, flex: 1, letterSpacing: 0.5 }}>
                  {p.name.toUpperCase()}
                </span>
                {s.label && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: s.labelColor, letterSpacing: 1 }}>{s.label}</span>}
                {!game.roundRevealed && selected === p.id && <div style={{ width: 14, height: 14, background: INK, flexShrink: 0 }} />}
              </button>
            )
          })}
        </div>

        {game.roundRevealed && (
          <div style={{
            marginTop: 12, padding: '12px 14px',
            border: `2px solid ${selected === correctId ? CORRECT : WRONG}`,
            background: `${selected === correctId ? CORRECT : WRONG}10`,
            textAlign: 'center', animation: 'pop 0.4s ease',
          }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 2, color: selected === correctId ? CORRECT : WRONG }}>
              {selected === correctId ? '+1 POINT!' : 'NOT QUITE'}
            </div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2, marginTop: 2 }}>
              THAT WAS {onStagePlayers[game.currentFactIdx]?.name?.toUpperCase()}'S FACT
            </div>
          </div>
        )}

        <Dash />
        {!submitted && !game.roundRevealed && (
          <InkBtn onClick={handleGuess} disabled={selected === null || submitting}>
            {submitting ? 'Submitting…' : 'Submit guess →'}
          </InkBtn>
        )}
        {submitted && !game.roundRevealed && (
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2, letterSpacing: 1, textAlign: 'center', marginBottom: 8 }}>
              {guessCount} OF {totalAudience} PLAYERS HAVE GUESSED
            </div>
            <div style={{ height: 4, background: DASH, marginBottom: 4 }}>
              <div style={{ height: '100%', background: INK, width: `${totalAudience > 0 ? (guessCount / totalAudience) * 100 : 0}%`, transition: 'width 1s ease' }} />
            </div>
          </div>
        )}
      </Paper>
    </Screen>
  )
}

function GroupStamp({ color, label, small }: { color: string; label: string; small?: boolean }) {
  return (
    <div style={{ display: 'inline-block', border: `${small ? 2 : 3}px solid ${color}`, padding: small ? '2px 10px' : '3px 14px', marginBottom: 8 }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: small ? 13 : 14, letterSpacing: 4, color }}>{label.toUpperCase()}</span>
    </div>
  )
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'center', margin: '6px 0' }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{ width: 24, height: 4, background: i <= current ? INK : DASH }} />
      ))}
    </div>
  )
}

function Screen({ children, bg }: { children: React.ReactNode; bg: string }) {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '56px 12px 40px' }}>
      <VintageBg screen={bg} />
      {children}
    </main>
  )
}
