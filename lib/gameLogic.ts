import { Game, Player } from './types'

export function getCurrentOnStageGroup(game: Game): string {
  return game.groupOrder[game.currentGroupIdx]
}

export function getOnStagePlayers(game: Game): Player[] {
  const group = getCurrentOnStageGroup(game)
  return game.players.filter(p => p.groupLetter === group)
}

export function getAudiencePlayers(game: Game): Player[] {
  const group = getCurrentOnStageGroup(game)
  return game.players.filter(p => p.groupLetter !== group)
}

export function getCurrentFactPlayer(game: Game): Player | null {
  const onStage = getOnStagePlayers(game)
  return onStage[game.currentFactIdx] ?? null
}

export function getRoundKey(game: Game): string {
  return `${getCurrentOnStageGroup(game)}_${game.currentFactIdx}`
}

export function getRoundGuesses(game: Game) {
  const key = getRoundKey(game)
  return game.guesses.filter(g => g.roundKey === key)
}

export function shouldAutoReveal(game: Game): boolean {
  const audience = getAudiencePlayers(game)
  const guesses = getRoundGuesses(game)
  return audience.length > 0 && guesses.length >= audience.length
}

export function applyReveal(game: Game): Game {
  const roundGuesses = getRoundGuesses(game)
  const updated = { ...game, roundRevealed: true }
  updated.players = game.players.map(p => {
    const correctGuesses = roundGuesses.filter(g => g.guesserId === p.id && g.isCorrect)
    return correctGuesses.length > 0 ? { ...p, score: p.score + 1 } : p
  })
  return updated
}

export function applyAdvance(game: Game): Game {
  const onStage = getOnStagePlayers(game)
  const isLastFact = game.currentFactIdx >= onStage.length - 1
  const isLastGroup = game.currentGroupIdx >= game.groupOrder.length - 1

  if (!isLastFact) {
    return { ...game, currentFactIdx: game.currentFactIdx + 1, roundRevealed: false }
  } else if (!isLastGroup) {
    return { ...game, currentGroupIdx: game.currentGroupIdx + 1, currentFactIdx: 0, roundRevealed: false }
  } else {
    return { ...game, status: 'finished' }
  }
}
