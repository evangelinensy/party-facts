'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { GroupBadge } from '@/components/GroupBadge'

type Identity = {
  isHost: boolean
  hostToken?: string
  playerToken?: string
  gameCode: string
}

export default function LobbyPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [starting, setStarting] = useState(false)
  const [startError, setStartError] = useState('')

  useEffect(() => {
    const raw = localStorage.getItem('pf_identity')
    if (raw) setIdentity(JSON.parse(raw))
  }, [])

  const token = identity?.isHost ? identity.hostToken : identity?.playerToken
  const { data, error } = useGameState(code, token)

  useEffect(() => {
    if (data?.game.status === 'playing') router.push(`/game/${code}`)
    if (data?.game.status === 'finished') router.push(`/leaderboard/${code}`)
  }, [data?.game.status, code, router])

  async function handleStart() {
    setStartError('')
    setStarting(true)
    try {
      const res = await fetch(`/api/games/${code}/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${identity?.hostToken}` },
      })
      const d = await res.json()
      if (!res.ok) { setStartError(d.error ?? 'Failed to start'); return }
      router.push(`/game/${code}`)
    } catch {
      setStartError('Network error')
    } finally {
      setStarting(false)
    }
  }

  if (error) return <Screen><p className="text-red-400">{error}</p></Screen>
  if (!data) return <Screen><p className="text-white/60">Loading...</p></Screen>

  const { game, players } = data
  const groups = ['A', 'B', 'C', 'D'] as const
  const byGroup = groups.map(g => ({
    letter: g,
    displayName: game.groupNames?.[g] || `Group ${g}`,
    members: players.filter(p => p.groupLetter === g),
  })).filter(g => g.members.length > 0)

  return (
    <Screen>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <p className="text-white/60 text-sm uppercase tracking-widest mb-1">Game Code</p>
          <div className="text-6xl font-black text-white tracking-widest">{code}</div>
          <p className="text-white/40 text-sm mt-1">Share this with your friends</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-4 space-y-3">
          <p className="text-white/60 text-sm uppercase tracking-widest">Players ({players.length})</p>
          {byGroup.map(({ letter, displayName, members }) => (
            <div key={letter}>
              <div className="flex items-center gap-2 mb-1">
                <GroupBadge group={letter} />
                <span className="text-white/60 text-sm">{displayName}</span>
              </div>
              <div className="flex flex-wrap gap-2 pl-9">
                {members.map(p => (
                  <span key={p.id} className="bg-white/10 text-white text-sm px-3 py-1 rounded-full">
                    {p.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {players.length === 0 && (
            <p className="text-white/40 text-sm">No players yet...</p>
          )}
        </div>

        {identity?.isHost ? (
          <div className="space-y-2">
            <button
              onClick={handleStart}
              disabled={starting}
              className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-lg rounded-xl transition-all min-h-[56px]"
            >
              {starting ? 'Starting...' : 'Start Game'}
            </button>
            {startError && <p className="text-red-400 text-sm text-center">{startError}</p>}
            <p className="text-white/40 text-xs text-center">Need at least 2 different groups</p>
            <button
              onClick={() => router.push(`/setup/${code}`)}
              className="w-full py-3 text-white/40 hover:text-white/70 text-sm transition-all"
            >
              ← Back to setup
            </button>
          </div>
        ) : (
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-white/60">Waiting for host to start...</p>
          </div>
        )}
      </div>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      {children}
    </main>
  )
}
