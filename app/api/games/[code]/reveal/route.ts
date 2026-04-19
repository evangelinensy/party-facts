import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'
import { getCurrentFactPlayer, applyReveal } from '@/lib/gameLogic'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'host' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'playing') return NextResponse.json({ error: 'Game not in progress' }, { status: 400 })
  if (game.roundRevealed) return NextResponse.json({ error: 'Already revealed' }, { status: 400 })

  const factPlayer = getCurrentFactPlayer(game)
  const revealed = applyReveal(game)
  await setGame(revealed)

  const scores: Record<string, number> = {}
  for (const p of revealed.players) scores[p.id] = p.score

  return NextResponse.json({
    correctPlayerId: factPlayer?.id ?? null,
    correctPlayerName: factPlayer?.name ?? null,
    scores,
  })
}
