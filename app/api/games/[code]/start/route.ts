import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'host' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'lobby') return NextResponse.json({ error: 'Game already started' }, { status: 400 })

  const distinctGroups = Array.from(new Set(game.players.map(p => p.groupLetter))).sort()
  if (distinctGroups.length < 2) {
    return NextResponse.json({ error: 'Need at least 2 different groups to start' }, { status: 400 })
  }

  await setGame({
    ...game,
    status: 'playing',
    groupOrder: distinctGroups,
    currentGroupIdx: 0,
    currentFactIdx: 0,
    roundRevealed: false,
  })

  return NextResponse.json({ success: true })
}
