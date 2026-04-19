import { NextResponse } from 'next/server'
import { getGame } from '@/lib/store'

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const { searchParams } = new URL(req.url)
  const name = searchParams.get('name')?.trim().toLowerCase()
  const group = searchParams.get('group')?.toUpperCase()

  const game = await getGame(params.code.toUpperCase())
  if (!game) return NextResponse.json({ fact: null })
  if (!name || !group) return NextResponse.json({ fact: null })

  const match = game.prefilledGuests.find(
    g => g.name.toLowerCase() === name && g.groupLetter === group
  )

  return NextResponse.json({ fact: match?.fact ?? null })
}
