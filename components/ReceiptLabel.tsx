'use client'
import { INK2 } from '@/lib/design'

export function ReceiptLabel({ children, center, size = 11 }: { children: React.ReactNode; center?: boolean; size?: number }) {
  return (
    <div style={{
      fontFamily: "'Space Mono', monospace",
      fontSize: size, fontWeight: 700, color: INK2,
      letterSpacing: 2, textTransform: 'uppercase',
      textAlign: center ? 'center' : 'left',
    }}>{children}</div>
  )
}
