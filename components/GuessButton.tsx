'use client'

type State = 'idle' | 'selected' | 'correct' | 'wrong' | 'missed'

type Props = {
  name: string
  playerId: string
  state: State
  disabled?: boolean
  onSelect: (id: string) => void
}

const STATE_STYLES: Record<State, string> = {
  idle: 'bg-white border-2 border-gray-200 text-gray-800 active:bg-gray-50',
  selected: 'bg-indigo-500 border-2 border-indigo-600 text-white',
  correct: 'bg-emerald-500 border-2 border-emerald-600 text-white',
  wrong: 'bg-red-500 border-2 border-red-600 text-white',
  missed: 'bg-emerald-100 border-2 border-emerald-300 text-emerald-800',
}

export function GuessButton({ name, playerId, state, disabled, onSelect }: Props) {
  return (
    <button
      className={`w-full text-left px-5 py-4 rounded-xl text-lg font-semibold transition-all min-h-[56px] ${STATE_STYLES[state]} ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
      onClick={() => !disabled && onSelect(playerId)}
      disabled={disabled}
    >
      {name}
      {state === 'correct' && ' ✓'}
      {state === 'wrong' && ' ✗'}
      {state === 'missed' && ' ← correct'}
    </button>
  )
}
