import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'
import { applyAdvance } from '@/lib/gameLogic'

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'host' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })
  if (!game.roundRevealed) return NextResponse.json({ error: 'Must reveal before advancing' }, { status: 400 })

  const advanced = applyAdvance(game)
  await setGame(advanced)

  return NextResponse.json({
    status: advanced.status,
    currentGroupIdx: advanced.currentGroupIdx,
    currentFactIdx: advanced.currentFactIdx,
  })
}
