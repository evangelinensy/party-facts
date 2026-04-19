'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useGameState } from '@/hooks/useGameState'
import { FactBox } from '@/components/FactBox'
import { GuessButton } from '@/components/GuessButton'
import { Timer } from '@/components/Timer'
import { GroupBadge } from '@/components/GroupBadge'

type Identity = {
  isHost: boolean
  hostToken?: string
  playerToken?: string
  playerId?: string
  playerGroup?: string
  gameCode: string
}

export default function GamePage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem('pf_identity')
    if (raw) setIdentity(JSON.parse(raw))
  }, [])

  const token = identity?.isHost ? identity.hostToken : identity?.playerToken
  const { data, error, refetch } = useGameState(code, token)

  const prevRoundKey = useRef<string>('')

  useEffect(() => {
    if (!data) return
    if (data.game.status === 'finished') { router.push(`/leaderboard/${code}`); return }
    const roundKey = `${data.game.currentGroupIdx}_${data.game.currentFactIdx}`
    if (roundKey !== prevRoundKey.current) {
      prevRoundKey.current = roundKey
      setSelectedPlayer(null)
      setSubmitted(false)
    }
    if (data.myGuess) setSubmitted(true)
  }, [data, code, router])

  async function handleReveal() {
    await fetch(`/api/games/${code}/reveal`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${identity?.hostToken}` },
    })
    refetch()
  }

  async function handleAdvance() {
    await fetch(`/api/games/${code}/advance`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${identity?.hostToken}` },
    })
    refetch()
  }

  async function handleGuess() {
    if (!selectedPlayer || submitting) return
    setSubmitting(true)
    try {
      await fetch(`/api/games/${code}/guess`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${identity?.playerToken}`,
        },
        body: JSON.stringify({ guessedPlayerId: selectedPlayer }),
      })
      setSubmitted(true)
      refetch()
    } finally {
      setSubmitting(false)
    }
  }

  if (error) return <Screen><p className="text-red-400">{error}</p></Screen>
  if (!data || !identity) return <Screen><p className="text-white/60">Loading...</p></Screen>

  const { game, onStagePlayers, audiencePlayers, guessCount, totalAudience, currentFact } = data
  const currentGroup = game.groupOrder[game.currentGroupIdx]
  const timerKey = `${game.currentGroupIdx}_${game.currentFactIdx}`

  const isHost = identity.isHost
  const isOnStage = !isHost && identity.playerGroup === currentGroup

  if (isHost) {
    return (
      <Screen>
        <HostView
          game={game}
          onStagePlayers={onStagePlayers}
          guessCount={guessCount}
          totalAudience={totalAudience}
          timerKey={timerKey}
          onReveal={handleReveal}
          onAdvance={handleAdvance}
        />
      </Screen>
    )
  }

  if (isOnStage) {
    return (
      <Screen>
        <OnStageView
          game={game}
          onStagePlayers={onStagePlayers}
          myPlayerId={identity.playerId!}
          timerKey={timerKey}
        />
      </Screen>
    )
  }

  return (
    <Screen>
      <AudienceView
        game={game}
        onStagePlayers={onStagePlayers}
        currentFact={currentFact}
        myPlayerId={identity.playerId!}
        selectedPlayer={selectedPlayer}
        submitted={submitted}
        submitting={submitting}
        guessCount={guessCount}
        totalAudience={totalAudience}
        timerKey={timerKey}
        onSelect={setSelectedPlayer}
        onSubmit={handleGuess}
      />
    </Screen>
  )
}

type GameState = NonNullable<ReturnType<typeof useGameState>['data']>

function groupDisplayName(game: GameState['game'], letter: string) {
  return game.groupNames?.[letter] || `Group ${letter}`
}

function HostView({ game, onStagePlayers, guessCount, totalAudience, timerKey, onReveal, onAdvance }: {
  game: GameState['game']
  onStagePlayers: GameState['onStagePlayers']
  guessCount: number
  totalAudience: number
  timerKey: string
  onReveal: () => void
  onAdvance: () => void
}) {
  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GroupBadge group={game.groupOrder[game.currentGroupIdx]} />
          <span className="text-white font-semibold">{groupDisplayName(game, game.groupOrder[game.currentGroupIdx])} on stage</span>
        </div>
        <Timer resetKey={timerKey} />
      </div>

      <div className="bg-white/10 rounded-2xl p-4">
        <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Current Fact Player</p>
        <p className="text-white text-xl font-bold">{onStagePlayers[game.currentFactIdx]?.name ?? '—'}</p>
        {game.roundRevealed && (
          <p className="text-emerald-300 text-sm mt-1">"{onStagePlayers[game.currentFactIdx]?.fact}"</p>
        )}
      </div>

      <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between">
        <span className="text-white/60">Guesses</span>
        <span className="text-white font-bold text-lg">{guessCount} / {totalAudience}</span>
      </div>

      {!game.roundRevealed ? (
        <button
          onClick={onReveal}
          className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-white font-bold text-lg rounded-xl min-h-[56px]"
        >
          Reveal Answer
        </button>
      ) : (
        <button
          onClick={onAdvance}
          className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-lg rounded-xl min-h-[56px]"
        >
          Next →
        </button>
      )}
    </div>
  )
}

function OnStageView({ game, onStagePlayers, myPlayerId, timerKey }: {
  game: GameState['game']
  onStagePlayers: GameState['onStagePlayers']
  myPlayerId: string
  timerKey: string
}) {
  const currentFactPlayer = onStagePlayers[game.currentFactIdx]
  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center py-4 bg-amber-500/20 rounded-2xl">
        <p className="text-amber-300 font-bold text-lg">{groupDisplayName(game, game.groupOrder[game.currentGroupIdx])} is on stage!</p>
        <p className="text-white/60 text-sm mt-1">Answer questions honestly</p>
      </div>

      <Timer resetKey={timerKey} />

      <div className="space-y-2">
        <p className="text-white/60 text-xs uppercase tracking-widest">On Stage</p>
        {onStagePlayers.map((p, i) => (
          <div
            key={p.id}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl ${i === game.currentFactIdx ? 'bg-amber-500/30 ring-2 ring-amber-400' : 'bg-white/10'}`}
          >
            <GroupBadge group={p.groupLetter} />
            <span className="text-white font-semibold flex-1">{p.name}</span>
            {p.id === myPlayerId && <span className="text-white/40 text-xs">you</span>}
            {i === game.currentFactIdx && <span className="text-amber-300 text-xs font-bold">← their fact</span>}
          </div>
        ))}
      </div>

      {game.roundRevealed && currentFactPlayer && (
        <div className="bg-white/10 rounded-2xl p-4">
          <p className="text-white/60 text-xs uppercase tracking-widest mb-1">The fact was</p>
          <p className="text-white font-semibold">{currentFactPlayer.fact}</p>
        </div>
      )}
    </div>
  )
}

function AudienceView({ game, onStagePlayers, currentFact, myPlayerId, selectedPlayer, submitted, submitting, guessCount, totalAudience, timerKey, onSelect, onSubmit }: {
  game: GameState['game']
  onStagePlayers: GameState['onStagePlayers']
  currentFact: string | null
  myPlayerId: string
  selectedPlayer: string | null
  submitted: boolean
  submitting: boolean
  guessCount: number
  totalAudience: number
  timerKey: string
  onSelect: (id: string) => void
  onSubmit: () => void
}) {
  const correctId = game.roundRevealed ? onStagePlayers[game.currentFactIdx]?.id : null

  function getButtonState(playerId: string) {
    if (!game.roundRevealed) {
      return selectedPlayer === playerId ? 'selected' : 'idle'
    }
    if (playerId === correctId) {
      return selectedPlayer === playerId ? 'correct' : 'missed'
    }
    if (playerId === selectedPlayer) return 'wrong'
    return 'idle'
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GroupBadge group={game.groupOrder[game.currentGroupIdx]} />
          <span className="text-white font-semibold">{groupDisplayName(game, game.groupOrder[game.currentGroupIdx])}</span>
        </div>
        <Timer resetKey={timerKey} />
      </div>

      {game.roundRevealed && currentFact ? (
        <FactBox fact={currentFact} />
      ) : (
        <div className="bg-white/10 rounded-2xl p-6">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-2">The Fact</p>
          <p className="text-white text-xl font-bold">Who said this?</p>
          <p className="text-white/60 text-sm mt-1">Pick the on-stage person whose fact this is</p>
        </div>
      )}

      <div className="space-y-2">
        {onStagePlayers.map(p => (
          <GuessButton
            key={p.id}
            name={p.name}
            playerId={p.id}
            state={getButtonState(p.id)}
            disabled={submitted || game.roundRevealed}
            onSelect={onSelect}
          />
        ))}
      </div>

      {!submitted && !game.roundRevealed && (
        <button
          onClick={onSubmit}
          disabled={!selectedPlayer || submitting}
          className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-40 text-white font-bold text-lg rounded-xl min-h-[56px]"
        >
          {submitting ? 'Submitting...' : 'Lock in Guess'}
        </button>
      )}

      {submitted && !game.roundRevealed && (
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <p className="text-white/60">{guessCount} / {totalAudience} have guessed</p>
        </div>
      )}

      {game.roundRevealed && (
        <div className={`rounded-2xl p-4 text-center ${selectedPlayer === correctId ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
          {selectedPlayer === correctId ? (
            <p className="text-emerald-300 font-bold text-lg">+1 point! Correct!</p>
          ) : (
            <p className="text-red-300 font-bold text-lg">Wrong guess</p>
          )}
          <p className="text-white/60 text-sm mt-1">
            It was {onStagePlayers[game.currentFactIdx]?.name}
          </p>
        </div>
      )}
    </div>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      {children}
    </main>
  )
}
