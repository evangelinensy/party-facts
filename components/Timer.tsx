'use client'
import { useEffect, useState } from 'react'
import { INK } from '@/lib/design'

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

  const color = seconds > 30 ? INK : seconds > 10 ? '#7A3A08' : '#8B1A1A'

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: 88, lineHeight: 1, color,
        letterSpacing: 4,
        transition: 'color 1s ease',
      }}>{String(seconds).padStart(2, '0')}</div>
    </div>
  )
}
