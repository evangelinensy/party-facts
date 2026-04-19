'use client'
import { GroupBadge } from './GroupBadge'

type Props = {
  name: string
  group: string
  highlight?: boolean
}

export function PlayerChip({ name, group, highlight }: Props) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${highlight ? 'bg-white/20 ring-2 ring-white' : 'bg-white/10'}`}>
      <GroupBadge group={group} />
      <span className="text-white font-medium">{name}</span>
    </div>
  )
}
