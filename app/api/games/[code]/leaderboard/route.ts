import { NextResponse } from 'next/server'
import { getGame } from '@/lib/store'

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const game = await getGame(params.code.toUpperCase())
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const players = [...game.players]
    .sort((a, b) => b.score - a.score)
    .map(p => ({ id: p.id, name: p.name, groupLetter: p.groupLetter, score: p.score, instagram: p.instagram ?? '', telegram: p.telegram ?? '' }))

  const groupMap = new Map<string, number>()
  for (const p of game.players) {
    groupMap.set(p.groupLetter, (groupMap.get(p.groupLetter) ?? 0) + p.score)
  }
  const groupScores = Array.from(groupMap.entries())
    .map(([group, totalScore]) => ({ group, totalScore }))
    .sort((a, b) => b.totalScore - a.totalScore)

  return NextResponse.json({ players, groupScores })
}
