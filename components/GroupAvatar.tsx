'use client'

export function GroupAvatar({ initial, color, size = 32 }: { initial: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      border: `2px solid ${color}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: size * 0.5, color, letterSpacing: 0,
    }}>{initial}</div>
  )
}
