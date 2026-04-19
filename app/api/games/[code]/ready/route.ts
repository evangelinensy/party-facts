import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (game.status !== 'playing') return NextResponse.json({ error: 'Game not in progress' }, { status: 400 })
  if (!game.groupIntermission) return NextResponse.json({ success: true, allReady: true })

  const body = await req.json().catch(() => ({}))
  const force = body?.force === true && token.role === 'host'

  let readyIds = new Set(game.readyPlayerIds ?? [])
  if (token.role === 'player' && token.playerId) {
    readyIds.add(token.playerId)
  }
  if (force) {
    for (const p of game.players) readyIds.add(p.id)
  }

  const allReady = game.players.length > 0 && game.players.every(p => readyIds.has(p.id))

  await setGame({
    ...game,
    readyPlayerIds: Array.from(readyIds),
    groupIntermission: allReady ? false : true,
  })

  return NextResponse.json({ success: true, allReady })
}
