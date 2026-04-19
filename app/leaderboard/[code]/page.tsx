'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VintageBg } from '@/components/VintageBg'
import { Paper } from '@/components/Paper'
import { Dash } from '@/components/Dash'
import { ReceiptLabel } from '@/components/ReceiptLabel'
import { BigStamp } from '@/components/BigStamp'
import { InkBtn } from '@/components/InkBtn'
import { GroupAvatar } from '@/components/GroupAvatar'
import { INK, INK2, DASH, GROUPS, CORRECT } from '@/lib/design'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

type PlayerEntry = { id: string; name: string; groupLetter: string; score: number; instagram?: string; telegram?: string }
type GroupScore = { group: string; totalScore: number }
type LeaderboardData = { players: PlayerEntry[]; groupScores: GroupScore[]; groupNames: Record<string, string> }

export default function LeaderboardPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [data, setData] = useState<LeaderboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/games/${code}/leaderboard`).then(r => r.json()),
      fetch(`/api/games/${code}`).then(r => r.json()),
    ])
      .then(([lb, gameData]) => setData({ ...lb, groupNames: gameData.game?.groupNames ?? {} }))
      .catch(() => setError('Could not load leaderboard'))
  }, [code])

  if (error) return <Screen><p style={{ fontFamily: "'Space Mono', monospace", color: '#8B1A1A', fontSize: 12 }}>{error}</p></Screen>
  if (!data) return <Screen><p style={{ fontFamily: "'Space Mono', monospace", color: INK2, fontSize: 12 }}>Loading…</p></Screen>

  const maxGroupScore = Math.max(...data.groupScores.map(g => g.totalScore), 1)

  return (
    <Screen>
      <Paper tilt={0.2}>
        <div style={{ textAlign: 'center' }}>
          <BigStamp>Results</BigStamp>
          <ReceiptLabel center>Final standings · {code}</ReceiptLabel>
        </div>
        <Dash />

        {/* Group scores bar chart */}
        {data.groupScores.length > 0 && (
          <>
            <ReceiptLabel>Group scores</ReceiptLabel>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 4 }}>
              {data.groupScores.map(({ group, totalScore }) => {
                const color = GROUPS[group]?.color ?? INK
                const name = data.groupNames?.[group] || GROUPS[group]?.defaultName || `Group ${group}`
                const pct = (totalScore / maxGroupScore) * 100
                return (
                  <div key={group}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color, letterSpacing: 1, textTransform: 'uppercase' }}>{name}</span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, color: INK, letterSpacing: 2 }}>{totalScore}</span>
                    </div>
                    <div style={{ height: 6, background: DASH }}>
                      <div style={{ height: '100%', background: color, width: `${pct}%`, transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
            <Dash />
          </>
        )}

        {/* Player rankings */}
        <ReceiptLabel>Player rankings</ReceiptLabel>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {data.players.map((p, i) => {
            const color = GROUPS[p.groupLetter]?.color ?? INK
            const isTop3 = i < 3
            return (
              <div key={p.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: isTop3 ? '10px 12px' : '7px 10px',
                border: isTop3 ? `2px solid ${i === 0 ? INK : DASH}` : `1px dashed ${DASH}`,
                background: i === 0 ? `${INK}06` : 'transparent',
              }}>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: isTop3 ? 22 : 16,
                  color: i === 0 ? INK : INK2,
                  letterSpacing: 1, width: 28, textAlign: 'center', flexShrink: 0,
                }}>{ROMAN[i] ?? i + 1}</span>
                <GroupAvatar initial={p.name[0]} color={color} size={isTop3 ? 34 : 26} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: isTop3 ? 14 : 12, fontWeight: 700, color: INK, letterSpacing: 0.5 }}>
                    {p.name.toUpperCase()}
                  </div>
                  {(p.instagram || p.telegram) && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                      {p.instagram && (
                        <a href={`https://instagram.com/${p.instagram}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#E1306C', textDecoration: 'none', letterSpacing: 0.5 }}>
                          @{p.instagram}
                        </a>
                      )}
                      {p.telegram && (
                        <a href={`https://t.me/${p.telegram}`} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: '#0088CC', textDecoration: 'none', letterSpacing: 0.5 }}>
                          tg:{p.telegram}
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: isTop3 ? 26 : 20,
                  color: i === 0 ? CORRECT : INK,
                  letterSpacing: 2, flexShrink: 0,
                }}>{p.score}</span>
              </div>
            )
          })}
        </div>

        <Dash />
        <InkBtn onClick={() => router.push('/')}>Play again →</InkBtn>

        <div style={{ marginTop: 16, textAlign: 'center', fontFamily: "'Caveat', cursive", fontSize: 20, color: INK2 }}>
          Thanks for playing FaceCard!
        </div>
      </Paper>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '56px 12px 40px' }}>
      <VintageBg screen="leaderboard" />
      {children}
    </main>
  )
}
