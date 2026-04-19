'use client'
import { GroupBadge } from './GroupBadge'

type PlayerEntry = { id: string; name: string; groupLetter: string; score: number }
type GroupEntry = { group: string; totalScore: number }

type Props = {
  players: PlayerEntry[]
  groupScores: GroupEntry[]
  groupNames?: Record<string, string>
}

const MEDALS = ['🥇', '🥈', '🥉']

export function Leaderboard({ players, groupScores, groupNames = {} }: Props) {
  const gName = (letter: string) => groupNames[letter] || `Group ${letter}`

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-white/60 text-sm uppercase tracking-widest mb-3">Players</h2>
        <div className="space-y-2">
          {players.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="w-8 text-xl">{MEDALS[i] ?? `${i + 1}.`}</span>
              <GroupBadge group={p.groupLetter} />
              <span className="flex-1 text-white font-semibold text-lg">{p.name}</span>
              <span className="text-white font-bold text-xl">{p.score}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-white/60 text-sm uppercase tracking-widest mb-3">Groups</h2>
        <div className="space-y-2">
          {groupScores.map((g, i) => (
            <div key={g.group} className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3">
              <span className="w-8 text-xl">{MEDALS[i] ?? `${i + 1}.`}</span>
              <GroupBadge group={g.group} />
              <span className="flex-1 text-white font-semibold text-lg">{gName(g.group)}</span>
              <span className="text-white font-bold text-xl">{g.totalScore}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
