'use client'
import { useEffect, useRef, useState } from 'react'
import { INK } from '@/lib/design'

export function Timer({
  resetKey, duration = 180, size = 88, fontFamily = "'Bebas Neue', sans-serif", letterSpacing = 4,
  sound = true,
}: {
  resetKey: string | number; duration?: number; size?: number; fontFamily?: string; letterSpacing?: number;
  sound?: boolean;
}) {
  const [seconds, setSeconds] = useState(duration)
  const tickRef = useRef<HTMLAudioElement | null>(null)
  const bellRef = useRef<HTMLAudioElement | null>(null)
  const bellFiredRef = useRef(false)

  // Kick off countdown + tick loop on mount / when round resets.
  useEffect(() => {
    setSeconds(duration)
    bellFiredRef.current = false

    if (sound && typeof window !== 'undefined') {
      if (!tickRef.current) {
        const a = new Audio('/clock-tick.mp3')
        a.volume = 0.5
        a.loop = true
        tickRef.current = a
      }
      if (!bellRef.current) {
        const b = new Audio('/bell.mp3')
        b.volume = 0.6
        b.preload = 'auto'
        bellRef.current = b
      }
      // Restart tick for new round (may no-op before first user gesture — browser will let us play later).
      tickRef.current.currentTime = 0
      tickRef.current.play().catch(() => {})
    }

    const id = setInterval(() => {
      setSeconds(s => (s <= 1 ? 0 : s - 1))
    }, 1000)

    return () => {
      clearInterval(id)
      if (tickRef.current) { tickRef.current.pause(); tickRef.current.currentTime = 0 }
      if (bellRef.current) { bellRef.current.pause(); bellRef.current.currentTime = 0 }
    }
  }, [resetKey, duration, sound])

  // When the countdown hits 0: stop tick, ring bell exactly once per round.
  useEffect(() => {
    if (seconds !== 0) return
    if (tickRef.current) { tickRef.current.pause(); tickRef.current.currentTime = 0 }
    if (sound && bellRef.current && !bellFiredRef.current) {
      bellFiredRef.current = true
      bellRef.current.currentTime = 0
      bellRef.current.play().catch(() => {})
    }
  }, [seconds, sound])

  const color = seconds > Math.floor(duration / 2) ? INK : seconds > Math.floor(duration / 6) ? '#7A3A08' : '#8B1A1A'
  const pad = String(duration).length < 3 ? 2 : 3

  return (
    <div style={{
      fontFamily, fontSize: size, lineHeight: 1, color, letterSpacing,
      transition: 'color 1s ease',
    }}>{String(seconds).padStart(pad, '0')}</div>
  )
}
