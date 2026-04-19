export type GameStatus = 'lobby' | 'playing' | 'finished'

export type Player = {
  id: string
  gameCode: string
  name: string
  groupLetter: 'A' | 'B' | 'C' | 'D'
  fact: string
  score: number
  joinedAt: number
}

export type PrefilledGuest = {
  id: string
  name: string
  groupLetter: 'A' | 'B' | 'C' | 'D'
  fact: string
}

export type Guess = {
  id: string
  gameCode: string
  roundKey: string
  guesserId: string
  guessedPlayerId: string
  isCorrect: boolean
  submittedAt: number
}

export type Game = {
  code: string
  status: GameStatus
  groupOrder: string[]
  currentGroupIdx: number
  currentFactIdx: number
  roundRevealed: boolean
  hostName: string
  hostSecret: string
  groupNames: Record<string, string>
  prefilledGuests: PrefilledGuest[]
  players: Player[]
  guesses: Guess[]
  createdAt: number
}
