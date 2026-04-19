'use client'
import { useMemo } from 'react'
import { BG_CONFIG } from '@/lib/design'

const IMAGES = ['/bg/bg1.avif','/bg/bg2.avif','/bg/bg3.avif','/bg/bg4.avif','/bg/bg5.avif','/bg/bg6.avif','/bg/bg7.avif']

// Stable per-mount pick so the image doesn't thrash on re-renders but rotates between visits.
export function VintageBg({ screen }: { screen: string }) {
  const cfg = BG_CONFIG[screen] ?? BG_CONFIG.home
  const url = useMemo(() => IMAGES[Math.floor(Math.random() * IMAGES.length)], [])

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
