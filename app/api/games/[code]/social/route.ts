import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'player' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const instagram = typeof body.instagram === 'string' ? body.instagram.trim().replace(/^@/, '') : undefined
  const telegram  = typeof body.telegram  === 'string' ? body.telegram.trim() : undefined

  const players = game.players.map(p => {
    if (p.id !== token.playerId) return p
    return {
      ...p,
      ...(instagram !== undefined && { instagram }),
      ...(telegram  !== undefined && { telegram }),
    }
  })

  await setGame({ ...game, players })
  return NextResponse.json({ success: true })
}
