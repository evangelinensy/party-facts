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
  const wrongFiredRef = useRef('')
  const autoAdvanceKeyRef = useRef('')
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Auto-advance ~5s after everyone has submitted and the round is revealed.
  // Guarded per-round so it fires at most once; cleared if the host manually advances.
  useEffect(() => {
    if (!data || !identity?.isHost) return
    const { game, guessCount, totalAudience } = data
    const roundKey = `${game.currentGroupIdx}_${game.currentFactIdx}`
    // Round changed — cancel any pending advance from the previous round.
    if (autoAdvanceKeyRef.current && autoAdvanceKeyRef.current !== roundKey) {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
      autoAdvanceTimerRef.current = null
      autoAdvanceKeyRef.current = ''
    }
    const everyoneGuessed = totalAudience > 0 && guessCount >= totalAudience
    if (game.roundRevealed && everyoneGuessed && autoAdvanceKeyRef.current !== roundKey) {
      autoAdvanceKeyRef.current = roundKey
      autoAdvanceTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/games/${code}/advance`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${identity.hostToken}` },
          })
          refetch()
        } catch {}
      }, 5000)
    }
  }, [data, identity, code, refetch])

  // Clean up pending timer on unmount.
  useEffect(() => () => {
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current)
  }, [])

  // Play a wrong-answer sound when the host reveals and the local audience player missed.
  useEffect(() => {
    if (!data || !identity) return
    const { game } = data
    if (!game.roundRevealed) return
    if (identity.isHost) return
    const currentGroup = game.groupOrder[game.currentGroupIdx]
    if (identity.playerGroup === currentGroup) return // on-stage doesn't guess
    const roundKey = `${game.currentGroupIdx}_${game.currentFactIdx}`
    if (wrongFiredRef.current === roundKey) return
    const correctId = data.onStagePlayers?.[game.currentFactIdx]?.id
    if (data.myGuess && correctId && data.myGuess !== correctId) {
      wrongFiredRef.current = roundKey
      try {
        const wrong = new Audio('/wrong.mp3')
        wrong.volume = 0.6
        wrong.play().catch(() => {})
      } catch {}
    }
  }, [data, identity])

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

  async function handleReady(force = false) {
    const authToken = identity?.isHost ? identity.hostToken : identity?.playerToken
    if (!authToken) return
    await fetch(`/api/games/${code}/ready`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify(force ? { force: true } : {}),
    })
    refetch()
  }

  async function handleGuess() {
    if (selected === null || submitting) return
    setSubmitting(true)
    try {
      const woosh = new Audio('/woosh.mp3')
      woosh.volume = 0.7
      woosh.play().catch(() => {})
    } catch {}
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

  if (game.groupIntermission) {
    return (
      <IntermissionScreen
        groupName={groupName}
        groupColor={groupColor}
        intermissionKey={`int_${game.currentGroupIdx}`}
        readyCount={game.readyCount ?? 0}
        totalPlayers={data.players.length}
        amIReady={!!game.amIReady}
        isHost={isHost}
        onReady={() => handleReady(false)}
        onForceStart={() => handleReady(true)}
      />
    )
  }

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
  const locked = submitted || game.roundRevealed
  const gotItRight = game.roundRevealed && selected === correctId
  const GREEN = '#6BD847'
  const GREEN_BRIGHT = '#C4E645'

  return (
    <main style={{
      position: 'relative', minHeight: '100vh',
      padding: '28px 14px 140px',
      display: 'flex', justifyContent: 'center',
    }}>
      <VintageBg screen="audience" />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 400,
        background: PAPER, borderRadius: 18,
        padding: '22px 22px 26px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
      }}>
        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Departure Mono', 'Space Mono', monospace", fontSize: 12, color: INK, letterSpacing: 2 }}>
              ON STAGE
            </div>
            <div style={{ fontFamily: "'Departure Mono', 'Space Mono', monospace", fontSize: 14, color: groupColor, letterSpacing: 2, marginTop: 3 }}>
              {groupName.toUpperCase()}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <img src="/timer.svg" alt="" width={30} height={30} />
            <Timer resetKey={timerKey} size={34} fontFamily="'Departure Mono', 'Space Mono', monospace" letterSpacing={1} />
          </div>
        </div>

        <div style={{ borderTop: `2px dashed ${DASH}`, marginBottom: 16 }} />

        {/* ── Prompt ── */}
        <div style={{
          fontFamily: "'Departure Mono', 'Space Mono', monospace",
          fontSize: 14, color: INK, letterSpacing: 1.5, lineHeight: 1.4, marginBottom: 12,
        }}>
          GUESS WHOSE FACT THIS<br />BELONGS TO
        </div>

        {/* ── Green fact box ── */}
        <div style={{
          background: GREEN_BRIGHT,
          padding: '18px 16px',
          marginBottom: 22,
          minHeight: 90,
          display: 'flex', alignItems: 'center',
        }}>
          <div style={{
            fontFamily: "'Departure Mono', 'Space Mono', monospace",
            fontSize: 18, color: INK, lineHeight: 1.45, letterSpacing: 0.5,
          }}>
            {currentFact ?? '…'}
          </div>
        </div>

        {/* ── "select a person" ── */}
        <div style={{
          textAlign: 'center',
          fontFamily: "'Departure Mono', 'Space Mono', monospace",
          fontSize: 13, color: INK2, letterSpacing: 1, marginBottom: 14,
        }}>select a person</div>

        {/* ── Grid ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          rowGap: 18, columnGap: 10,
          justifyItems: 'center',
        }}>
          {onStagePlayers.map(p => {
            const isSel = selected === p.id
            const isOwner = p.id === correctId
            const ring = game.roundRevealed && isOwner ? GREEN
                       : game.roundRevealed && isSel && !isOwner ? WRONG
                       : isSel ? GREEN : 'transparent'
            const nameColor = game.roundRevealed && isOwner ? GREEN
                            : game.roundRevealed && isSel && !isOwner ? WRONG
                            : isSel ? GREEN : INK
            return (
              <button
                key={p.id}
                onClick={() => !locked && setSelected(p.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  background: 'transparent', border: 'none', padding: 0,
                  cursor: locked ? 'default' : 'pointer',
                }}
              >
                <div style={{
                  width: 66, height: 66, borderRadius: '50%', padding: 3,
                  border: ring === 'transparent' ? 'none' : `3px solid ${ring}`,
                  background: '#2A2A2A',
                  overflow: 'hidden', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxSizing: 'content-box',
                }}>
                  {p.photo ? (
                    <img src={p.photo} alt={p.name} style={{
                      width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%',
                    }} />
                  ) : (
                    <span style={{
                      width: '100%', height: '100%', borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 28, color: '#FFF',
                      background: groupColor,
                    }}>{p.name[0]?.toUpperCase()}</span>
                  )}
                </div>
                <span style={{
                  fontFamily: "'Departure Mono', 'Space Mono', monospace",
                  fontSize: 12, color: nameColor, letterSpacing: 0.5,
                  maxWidth: 78, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{p.name}</span>
              </button>
            )
          })}
        </div>

        {/* ── Reveal banner ── */}
        {game.roundRevealed && (
          <div style={{
            marginTop: 22, padding: '12px 14px',
            border: `2px solid ${gotItRight ? GREEN : WRONG}`,
            background: `${gotItRight ? GREEN : WRONG}15`,
            textAlign: 'center', animation: 'pop 0.4s ease',
          }}>
            <div style={{
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 22, color: gotItRight ? GREEN : WRONG, letterSpacing: 2,
            }}>
              {gotItRight ? '+1 POINT!' : 'NOT QUITE'}
            </div>
            <div style={{
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 11, color: INK2, marginTop: 4, letterSpacing: 1,
            }}>
              THAT WAS {onStagePlayers[game.currentFactIdx]?.name?.toUpperCase()}'S FACT
            </div>
          </div>
        )}

        {submitted && !game.roundRevealed && (
          <div style={{ marginTop: 18 }}>
            <div style={{
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 11, color: INK2, letterSpacing: 1, textAlign: 'center', marginBottom: 6,
            }}>
              {guessCount} OF {totalAudience} PLAYERS HAVE GUESSED
            </div>
            <div style={{ height: 4, background: DASH }}>
              <div style={{
                height: '100%', background: INK,
                width: `${totalAudience > 0 ? (guessCount / totalAudience) * 100 : 0}%`,
                transition: 'width 1s ease',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky floating Submit Answer ── */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        padding: '16px 16px 22px',
        display: 'flex', justifyContent: 'center',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0))',
        pointerEvents: 'none', zIndex: 20,
      }}>
        <button
          onClick={handleGuess}
          disabled={locked || selected === null || submitting}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 320,
            padding: '16px 28px',
            background: (selected === null || locked) ? '#8E857A' : '#FF4A1C',
            border: 'none', borderRadius: 999,
            fontFamily: "'Departure Mono', 'Space Mono', monospace",
            fontSize: 18, color: '#FFF', letterSpacing: 3,
            cursor: (locked || selected === null) ? 'default' : 'pointer',
            opacity: (locked && !submitted) ? 0.5 : 1,
            boxShadow: (selected !== null && !locked) ? '0 6px 0 rgba(0,0,0,0.25), 0 12px 24px rgba(255,74,28,0.35)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {submitting ? 'SUBMITTING…' : submitted && !game.roundRevealed ? 'ANSWER LOCKED IN' : 'SUBMIT ANSWER'}
        </button>
      </div>

      <IdleToast message="Ask the group on stage any questions!" />
    </main>
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

function IntermissionScreen({
  groupName, groupColor, intermissionKey,
  readyCount, totalPlayers, amIReady, isHost,
  onReady, onForceStart,
}: {
  groupName: string; groupColor: string; intermissionKey: string;
  readyCount: number; totalPlayers: number; amIReady: boolean; isHost: boolean;
  onReady: () => void; onForceStart: () => void;
}) {
  // If the countdown runs out, auto-mark this viewer ready so the round can start.
  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady
  useEffect(() => {
    const t = setTimeout(() => { onReadyRef.current() }, 120_000)
    return () => clearTimeout(t)
  }, [intermissionKey])

  return (
    <main style={{
      position: 'relative', minHeight: '100vh',
      padding: '48px 20px 140px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <VintageBg screen="onstage" />

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 420, width: '100%' }}>
        <div style={{
          fontFamily: "'Departure Mono', 'Space Mono', monospace",
          fontSize: 14, color: '#FFF', letterSpacing: 3, marginBottom: 12, opacity: 0.8,
        }}>UP ON STAGE NEXT</div>

        <div style={{
          display: 'inline-block',
          padding: '10px 28px',
          border: `3px solid ${groupColor}`,
          marginBottom: 36,
          background: `${groupColor}20`,
        }}>
          <span style={{
            fontFamily: "'Departure Mono', 'Space Mono', monospace",
            fontSize: 28, color: groupColor, letterSpacing: 4,
          }}>{groupName.toUpperCase()}</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'inline-block' }}>
            <Timer
              resetKey={intermissionKey}
              duration={120}
              size={120}
              fontFamily="'Departure Mono', 'Space Mono', monospace"
              letterSpacing={4}
              sound={false}
            />
          </div>
          <div style={{
            fontFamily: "'Departure Mono', 'Space Mono', monospace",
            fontSize: 12, color: '#FFF', letterSpacing: 2, opacity: 0.6, marginTop: 6,
          }}>SECONDS</div>
        </div>

        <div style={{
          fontFamily: "'Departure Mono', 'Space Mono', monospace",
          fontSize: 13, color: '#FFF', letterSpacing: 2, opacity: 0.8,
        }}>
          {readyCount} / {totalPlayers} READY
        </div>
      </div>

      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0,
        padding: '16px 16px 22px',
        display: 'flex', justifyContent: 'center',
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 40%, rgba(0,0,0,0))',
        zIndex: 20,
      }}>
        {isHost ? (
          <button
            onClick={onForceStart}
            style={{
              width: '100%', maxWidth: 320,
              padding: '16px 28px',
              background: '#FF4A1C', border: 'none', borderRadius: 999,
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 18, color: '#FFF', letterSpacing: 3, cursor: 'pointer',
              boxShadow: '0 6px 0 rgba(0,0,0,0.25), 0 12px 24px rgba(255,74,28,0.35)',
            }}
          >
            START NOW
          </button>
        ) : (
          <button
            onClick={onReady}
            disabled={amIReady}
            style={{
              width: '100%', maxWidth: 320,
              padding: '16px 28px',
              background: amIReady ? '#3AA84E' : '#FF4A1C',
              border: 'none', borderRadius: 999,
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 18, color: '#FFF', letterSpacing: 3,
              cursor: amIReady ? 'default' : 'pointer',
              boxShadow: amIReady ? 'none' : '0 6px 0 rgba(0,0,0,0.25), 0 12px 24px rgba(255,74,28,0.35)',
              transition: 'all 0.2s',
            }}
          >
            {amIReady ? 'READY ✓' : "I'M READY"}
          </button>
        )}
      </div>
    </main>
  )
}

function IdleToast({ message, delayMs = 10000 }: { message: string; delayMs?: number }) {
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (dismissed) return
    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current)
      setShow(false)
      timerRef.current = setTimeout(() => setShow(true), delayMs)
    }
    reset()
    const events = ['pointerdown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    return () => {
      events.forEach(e => window.removeEventListener(e, reset))
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [delayMs, dismissed])

  if (dismissed || !show) return null

  return (
    <div style={{
      position: 'fixed', bottom: 96, right: 16,
      background: '#1A1A1A', color: '#FFF',
      padding: '10px 14px', paddingRight: 34,
      borderRadius: 12, border: '1px solid #333',
      maxWidth: 260, zIndex: 30,
      fontFamily: "'Space Mono', monospace", fontSize: 12, lineHeight: 1.4,
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      animation: 'slideUp 0.3s ease',
    }}>
      {message}
      <button
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        style={{
          position: 'absolute', top: 6, right: 6,
          width: 22, height: 22, border: 'none', background: 'transparent',
          color: '#FFF', cursor: 'pointer', fontSize: 16, lineHeight: 1,
        }}
      >×</button>
    </div>
  )
}
