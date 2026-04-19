import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'
import {
  getCurrentOnStageGroup,
  getCurrentFactPlayer,
  getRoundKey,
  shouldAutoReveal,
  applyReveal,
} from '@/lib/gameLogic'
import { Guess } from '@/lib/types'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'player' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'playing') return NextResponse.json({ error: 'Game not in progress' }, { status: 400 })
  if (game.roundRevealed) return NextResponse.json({ error: 'Round already revealed' }, { status: 400 })

  const onStageGroup = getCurrentOnStageGroup(game)
  const guesserPlayer = game.players.find(p => p.id === token.playerId)
  if (!guesserPlayer) return NextResponse.json({ error: 'Player not found' }, { status: 404 })
  if (guesserPlayer.groupLetter === onStageGroup) {
    return NextResponse.json({ error: 'On-stage players cannot guess' }, { status: 400 })
  }

  const roundKey = getRoundKey(game)
  const existing = game.guesses.find(g => g.guesserId === token.playerId && g.roundKey === roundKey)
  if (existing) return NextResponse.json({ success: true })

  const body = await req.json().catch(() => ({}))
  const { guessedPlayerId } = body
  if (!guessedPlayerId) return NextResponse.json({ error: 'guessedPlayerId is required' }, { status: 400 })

  const factPlayer = getCurrentFactPlayer(game)
  if (!factPlayer) return NextResponse.json({ error: 'No current fact player' }, { status: 400 })

  const guess: Guess = {
    id: crypto.randomUUID(),
    gameCode: code,
    roundKey,
    guesserId: token.playerId,
    guessedPlayerId,
    isCorrect: guessedPlayerId === factPlayer.id,
    submittedAt: Date.now(),
  }

  game = { ...game, guesses: [...game.guesses, guess] }
  if (shouldAutoReveal(game)) game = applyReveal(game)

  await setGame(game)
  return NextResponse.json({ success: true })
}
