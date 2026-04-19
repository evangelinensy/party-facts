import { NextResponse } from 'next/server'
import { getGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import {
  getCurrentOnStageGroup,
  getOnStagePlayers,
  getAudiencePlayers,
  getCurrentFactPlayer,
  getRoundKey,
  getRoundGuesses,
} from '@/lib/gameLogic'
import { Player } from '@/lib/types'

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const game = await getGame(params.code.toUpperCase())
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const tokenPayload = getTokenFromHeader(req)
  const myPlayerId = tokenPayload?.role === 'player' ? tokenPayload.playerId : null
  const me = myPlayerId ? game.players.find(p => p.id === myPlayerId) : null

  const onStageGroup = game.status === 'playing' ? getCurrentOnStageGroup(game) : null
  const viewerIsOnStage = !!(me && onStageGroup && me.groupLetter === onStageGroup)
  const onStagePlayers = game.status === 'playing' ? getOnStagePlayers(game) : []
  const audiencePlayers = game.status === 'playing' ? getAudiencePlayers(game) : []
  const factPlayer = game.status === 'playing' ? getCurrentFactPlayer(game) : null
  const roundGuesses = game.status === 'playing' ? getRoundGuesses(game) : []

  const sanitizeFact = (p: Player): Player => {
    if (game.status === 'playing' && !game.roundRevealed && p.groupLetter === onStageGroup) {
      return { ...p, fact: '' }
    }
    return p
  }

  const players = game.players.map(sanitizeFact)

  let myGuess: string | null = null
  let myGuessCorrect: boolean | null = null
  if (myPlayerId && game.status === 'playing') {
    const roundKey = getRoundKey(game)
    const guess = game.guesses.find(g => g.guesserId === myPlayerId && g.roundKey === roundKey)
    if (guess) {
      myGuess = guess.guessedPlayerId
      myGuessCorrect = game.roundRevealed ? guess.isCorrect : null
    }
  }

  return NextResponse.json({
    game: {
      code: game.code,
      status: game.status,
      groupOrder: game.groupOrder,
      currentGroupIdx: game.currentGroupIdx,
      currentFactIdx: game.currentFactIdx,
      roundRevealed: game.roundRevealed,
      hostName: game.hostName,
      groupNames: game.groupNames,
      groupIntermission: !!game.groupIntermission,
      readyCount: (game.readyPlayerIds ?? []).length,
      amIReady: !!(myPlayerId && (game.readyPlayerIds ?? []).includes(myPlayerId)),
    },
    players,
    onStagePlayers: onStagePlayers.map(sanitizeFact),
    audiencePlayers,
    currentFact: factPlayer && !viewerIsOnStage ? factPlayer.fact : null,
    currentFactPlayerId: game.roundRevealed && factPlayer ? factPlayer.id : null,
    currentFactPlayerName: game.roundRevealed && factPlayer ? factPlayer.name : null,
    guessCount: roundGuesses.length,
    totalAudience: audiencePlayers.length,
    myGuess,
    myGuessCorrect,
  }, { headers: { 'Cache-Control': 'no-store, max-age=0' } })
}
