'use client'
import { PAPER } from '@/lib/design'

function ZigZag({ flip = false, teeth = 26, h = 12 }: { flip?: boolean; teeth?: number; h?: number }) {
  const w = 400
  const pts: string[] = [`0,${flip ? 0 : h}`]
  for (let i = 0; i <= teeth; i++) {
    const x = (i / teeth) * w
    const y = flip ? (i % 2 === 0 ? 0 : h) : (i % 2 === 0 ? h : 0)
    pts.push(`${x.toFixed(1)},${y}`)
  }
  pts.push(flip ? `${w},0` : `${w},${h}`)
  return (
    <svg width="100%" height={h} viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <polygon points={pts.join(' ')} fill={PAPER} />
    </svg>
  )
}

export function Paper({ children, tilt = -0.5 }: { children: React.ReactNode; tilt?: number }) {
  return (
    <div style={{
      position: 'relative', zIndex: 10,
      margin: '0 auto',
      width: 'calc(100% - 24px)',
      transform: `rotate(${tilt}deg)`,
      transformOrigin: 'center top',
      filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.55))',
      animation: 'receiptIn 0.5s cubic-bezier(.2,.8,.4,1) both',
    }}>
      <ZigZag flip={false} teeth={26} h={12} />
      <div style={{
        background: PAPER,
        backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='p'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='200' height='200' filter='url(%23p)' opacity='0.08'/></svg>")`,
        backgroundSize: '200px 200px',
        padding: '16px 20px',
      }}>
        {children}
      </div>
      <ZigZag flip={true} teeth={26} h={12} />
    </div>
  )
}
