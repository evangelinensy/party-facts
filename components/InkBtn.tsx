'use client'
import { INK, PAPER, DASH } from '@/lib/design'

type Props = {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  outline?: boolean
  color?: string
  type?: 'button' | 'submit'
}

export function InkBtn({ children, onClick, disabled, outline, color = INK, type = 'button' }: Props) {
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={{
        width: '100%', padding: '14px 16px',
        background: outline || disabled ? 'transparent' : color,
        border: `2px solid ${disabled ? DASH : color}`,
        color: outline || disabled ? (disabled ? DASH : color) : PAPER,
        fontFamily: "'Space Mono', monospace",
        fontWeight: 700, fontSize: 14, letterSpacing: 1,
        textTransform: 'uppercase', cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.15s', minHeight: 48,
      }}
    >{children}</button>
  )
}
