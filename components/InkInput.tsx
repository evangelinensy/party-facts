'use client'
import { INK, INK2, DASH } from '@/lib/design'
import { ReceiptLabel } from './ReceiptLabel'

type Props = {
  label?: string
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  big?: boolean
  prefix?: string
}

export function InkInput({ label, value, onChange, placeholder, big, prefix }: Props) {
  return (
    <div>
      {label && <ReceiptLabel>{label}</ReceiptLabel>}
      <div style={{ marginTop: 6, position: 'relative' }}>
        {prefix && (
          <span style={{
            position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
            fontFamily: "'Space Mono', monospace", fontSize: 14, color: INK2,
          }}>{prefix}</span>
        )}
        <input
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          style={{
            width: '100%', padding: big ? '12px' : '10px 12px',
            paddingLeft: prefix ? 26 : 12,
            background: 'transparent',
            border: `1.5px solid ${DASH}`,
            fontFamily: big ? "'Bebas Neue', sans-serif" : "'Space Mono', monospace",
            fontSize: big ? 34 : 14, letterSpacing: big ? 4 : 0,
            color: INK, textAlign: big ? 'center' : 'left',
          }}
        />
      </div>
    </div>
  )
}
