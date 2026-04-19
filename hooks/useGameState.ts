'use client'
import { useEffect, useState, useCallback } from 'react'
import { Player } from '@/lib/types'

export type GameState = {
  game: {
    code: string
    status: 'lobby' | 'playing' | 'finished'
    groupOrder: string[]
    currentGroupIdx: number
    currentFactIdx: number
    roundRevealed: boolean
    hostName: string
    groupNames: Record<string, string>
    groupIntermission?: boolean
    readyCount?: number
    amIReady?: boolean
  }
  players: Player[]
  onStagePlayers: Player[]
  audiencePlayers: Player[]
  currentFact: string | null
  currentFactPlayerId: string | null
  currentFactPlayerName: string | null
  guessCount: number
  totalAudience: number
  myGuess: string | null
  myGuessCorrect: boolean | null
}

export function useGameState(code: string, token?: string, intervalMs = 2000) {
  const [data, setData] = useState<GameState | null>(null)
  const [error, setError] = useState<string | null>(null)

  const doFetch = useCallback(async () => {
    const res = await fetch(`/api/games/${code}?t=${Date.now()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: 'no-store',
    })
    if (!res.ok) {
      setError('Game not found')
      return
    }
    setData(await res.json())
  }, [code, token])

  useEffect(() => {
    doFetch()
    const id = setInterval(doFetch, intervalMs)
    return () => clearInterval(id)
  }, [doFetch, intervalMs])

  return { data, error, refetch: doFetch }
}
