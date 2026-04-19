'use client'
import { useEffect, useState } from 'react'

export function Timer({ resetKey }: { resetKey: string | number }) {
  const [seconds, setSeconds] = useState(60)

  useEffect(() => {
    setSeconds(60)
    const id = setInterval(() => {
      setSeconds(s => {
        if (s <= 1) { clearInterval(id); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [resetKey])

  const pct = (seconds / 60) * 100
  const color = seconds > 20 ? 'text-emerald-400' : seconds > 10 ? 'text-amber-400' : 'text-red-400'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-4xl font-bold tabular-nums ${color}`}>{seconds}</span>
      <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${seconds > 20 ? 'bg-emerald-400' : seconds > 10 ? 'bg-amber-400' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
