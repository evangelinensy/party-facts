import { NextResponse } from 'next/server'
import { getGame, setGame } from '@/lib/store'
import { getTokenFromHeader } from '@/lib/auth'
import { PrefilledGuest } from '@/lib/types'

const VALID_GROUPS = ['A', 'B', 'C', 'D'] as const

export async function PATCH(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'host' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  const body = await req.json().catch(() => ({}))
  const { groupNames, guests } = body

  let updatedGroupNames = game.groupNames
  if (groupNames && typeof groupNames === 'object') {
    updatedGroupNames = { ...game.groupNames }
    for (const letter of VALID_GROUPS) {
      if (typeof groupNames[letter] === 'string') {
        const name = groupNames[letter].trim()
        if (name) {
          updatedGroupNames[letter] = name
        } else {
          delete updatedGroupNames[letter]
        }
      }
    }
  }

  let updatedGuests = game.prefilledGuests
  if (Array.isArray(guests)) {
    updatedGuests = []
    for (const g of guests) {
      if (!g.name?.trim() || !VALID_GROUPS.includes(g.groupLetter)) continue
      const guest: PrefilledGuest = {
        id: g.id ?? crypto.randomUUID(),
        name: g.name.trim(),
        groupLetter: g.groupLetter,
        fact: g.fact?.trim() ?? '',
      }
      updatedGuests.push(guest)
    }
  }

  await setGame({ ...game, groupNames: updatedGroupNames, prefilledGuests: updatedGuests })
  return NextResponse.json({ success: true })
}

export async function GET(req: Request, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase()
  const token = getTokenFromHeader(req)
  if (!token || token.role !== 'host' || token.code !== code) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const game = await getGame(code)
  if (!game) return NextResponse.json({ error: 'Game not found' }, { status: 404 })

  return NextResponse.json({ groupNames: game.groupNames, guests: game.prefilledGuests })
}
