'use client'
import { BG_CONFIG } from '@/lib/design'

export function VintageBg({ screen }: { screen: string }) {
  const cfg = BG_CONFIG[screen] ?? BG_CONFIG.home
  const url = `https://images.unsplash.com/photo-${cfg.photo}?w=420&h=900&fit=crop&q=75&auto=format`
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${url})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        filter: 'saturate(0.5) brightness(0.75)',
      }} />
      <div style={{ position: 'absolute', inset: 0, background: cfg.tint, mixBlendMode: 'multiply' }} />
      <div style={{ position: 'absolute', inset: 0, background: cfg.overlay }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.6) 100%)',
      }} />
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300'><filter id='g'><feTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='300' height='300' filter='url(%23g)' opacity='1'/></svg>")`,
        backgroundSize: '300px 300px',
        mixBlendMode: 'overlay',
      }} />
    </div>
  )
}
