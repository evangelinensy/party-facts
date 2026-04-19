import { NextResponse } from 'next/server'
import { generateCode, gameExists, setGame } from '@/lib/store'
import { signHostToken } from '@/lib/auth'
import { Game } from '@/lib/types'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const { hostName, customCode } = body

  if (!hostName || typeof hostName !== 'string' || !hostName.trim()) {
    return NextResponse.json({ error: 'hostName is required' }, { status: 400 })
  }

  if (customCode) {
    const normalized = String(customCode).toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (normalized.length < 3 || normalized.length > 8) {
      return NextResponse.json({ error: 'Custom code must be 3–8 alphanumeric characters' }, { status: 400 })
    }
    if (await gameExists(normalized)) {
      return NextResponse.json({ error: 'That game code is already in use' }, { status: 409 })
    }
  }

  const code = await generateCode(customCode)
  const hostSecret = crypto.randomUUID()

  const game: Game = {
    code,
    status: 'lobby',
    groupOrder: [],
    currentGroupIdx: 0,
    currentFactIdx: 0,
    roundRevealed: false,
    hostName: hostName.trim(),
    hostSecret,
    groupNames: {},
    prefilledGuests: [],
    players: [],
    guesses: [],
    createdAt: Date.now(),
  }

  await setGame(game)
  const hostToken = signHostToken(code)

  return NextResponse.json({ code, hostToken })
}
