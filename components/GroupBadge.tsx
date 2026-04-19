'use client'

const GROUP_COLORS: Record<string, string> = {
  A: 'bg-indigo-500 text-white',
  B: 'bg-amber-500 text-white',
  C: 'bg-emerald-500 text-white',
  D: 'bg-red-500 text-white',
}

export function GroupBadge({ group }: { group: string }) {
  const cls = GROUP_COLORS[group] ?? 'bg-gray-500 text-white'
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${cls}`}>
      {group}
    </span>
  )
}
