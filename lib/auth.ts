import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET!

export function signHostToken(code: string): string {
  return jwt.sign({ code, role: 'host' }, SECRET, { expiresIn: '24h' })
}

export function signPlayerToken(code: string, playerId: string, group: string, name: string): string {
  return jwt.sign({ code, playerId, group, name, role: 'player' }, SECRET, { expiresIn: '24h' })
}

export function verifyToken(token: string): any {
  return jwt.verify(token, SECRET)
}

export function getTokenFromHeader(req: Request): any | null {
  const auth = req.headers.get('authorization')
  if (!auth) return null
  try {
    return verifyToken(auth.replace('Bearer ', ''))
  } catch {
    return null
  }
}
