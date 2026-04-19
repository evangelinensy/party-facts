import { Game } from './types'

// ---------------------------------------------------------------------------
// KV backend (Vercel production) vs in-memory fallback (local dev)
// ---------------------------------------------------------------------------
// On Vercel: set KV_REST_API_URL + KV_REST_API_TOKEN in the dashboard (one-click KV store).
// Locally:   no setup needed — falls back to an in-memory Map that survives HMR.
// ---------------------------------------------------------------------------

const hasKV = !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)

// In-memory fallback — persists across HMR via global
declare global {
  // eslint-disable-next-line no-var
  var __games: Map<string, Game> | undefined
}
const mem: Map<string, Game> = global.__games ?? (global.__games = new Map())

async function kvGet(code: string): Promise<Game | undefined> {
  const { kv } = await import('@vercel/kv')
  return (await kv.get<Game>(`game:${code}`)) ?? undefined
}
async function kvSet(game: Game): Promise<void> {
  const { kv } = await import('@vercel/kv')
  await kv.set(`game:${game.code}`, game, { ex: 12 * 60 * 60 })
}
async function kvDel(code: string): Promise<void> {
  const { kv } = await import('@vercel/kv')
  await kv.del(`game:${code}`)
}
async function kvExists(code: string): Promise<boolean> {
  const { kv } = await import('@vercel/kv')
  return (await kv.exists(`game:${code}`)) === 1
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function getGame(code: string): Promise<Game | undefined> {
  return hasKV ? kvGet(code) : mem.get(code)
}

export async function setGame(game: Game): Promise<void> {
  if (hasKV) return kvSet(game)
  mem.set(game.code, game)
}

export async function deleteGame(code: string): Promise<void> {
  if (hasKV) return kvDel(code)
  mem.delete(code)
}

export async function gameExists(code: string): Promise<boolean> {
  return hasKV ? kvExists(code) : mem.has(code)
}

export async function generateCode(custom?: string): Promise<string> {
  if (custom) {
    const normalized = custom.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (normalized.length >= 3 && normalized.length <= 8 && !(await gameExists(normalized))) {
      return normalized
    }
  }
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  do {
    code = Array.from({ length: 5 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('')
  } while (await gameExists(code))
  return code
}

// In-memory cleanup (local dev only — KV uses TTL set per key)
if (!hasKV) {
  setInterval(() => {
    const cutoff = Date.now() - 12 * 60 * 60 * 1000
    for (const [code, game] of mem.entries()) {
      if (game.createdAt < cutoff) mem.delete(code)
    }
  }, 30 * 60 * 1000)
}
