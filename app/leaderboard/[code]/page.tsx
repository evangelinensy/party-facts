'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Leaderboard } from '@/components/Leaderboard'

type LeaderboardData = {
  players: { id: string; name: string; groupLetter: string; score: number }[]
  groupScores: { group: string; totalScore: number }[]
  groupNames: Record<string, string>
}

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
      .then(([lb, gameData]) => {
        setData({ ...lb, groupNames: gameData.game?.groupNames ?? {} })
      })
      .catch(() => setError('Could not load leaderboard'))
  }, [code])

  if (error) return <Screen><p className="text-red-400">{error}</p></Screen>
  if (!data) return <Screen><p className="text-white/60">Loading...</p></Screen>

  const winner = data.players[0]

  return (
    <Screen>
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-black text-white mb-1">Game Over!</h1>
          {winner && (
            <p className="text-white/60">
              {winner.name} wins with {winner.score} point{winner.score !== 1 ? 's' : ''}!
            </p>
          )}
        </div>

        <Leaderboard players={data.players} groupScores={data.groupScores} groupNames={data.groupNames} />

        <button
          onClick={() => router.push('/')}
          className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-xl min-h-[56px]"
        >
          Play Again
        </button>
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
