import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { signPlayerToken } from '@/lib/auth'
import { Player } from '@/lib/types'

const VALID_GROUPS = ['A', 'B', 'C', 'D'] as const

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'lobby') return NextResponse.json({ error: 'Game already started' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const { name, group, fact, photo } = body

  if (!name?.trim() || !group || !fact?.trim()) {
    return NextResponse.json({ error: 'name, group, and fact are required' }, { status: 400 })
  }
  if (!VALID_GROUPS.includes(group)) {
    return NextResponse.json({ error: 'group must be A, B, C, or D' }, { status: 400 })
  }

  const playerId = crypto.randomUUID()
  const player: Player = {
    id: playerId,
    gameCode: code,
    name: name.trim(),
    groupLetter: group,
    fact: fact.trim(),
    score: 0,
    joinedAt: Date.now(),
    ...(typeof photo === 'string' && photo.startsWith('data:image/') && photo.length < 600_000 ? { photo } : {}),
  }

  await setGame({ ...game, players: [...game.players, player] })
  const playerToken = signPlayerToken(code, playerId, group, name.trim())

  return NextResponse.json({ playerId, playerToken })
}
