'use client'
import { INK } from '@/lib/design'

export function BigStamp({ children, color = INK }: { children: React.ReactNode; color?: string }) {
  return (
    <div style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: 52, lineHeight: 1, color,
      letterSpacing: 2, textAlign: 'center',
      animation: 'stampIn 0.3s ease',
    }}>{children}</div>
  )
}
