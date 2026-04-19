'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function OnboardingPage() {
  const router = useRouter()
  const [joinOpen, setJoinOpen] = useState(false)
  const [code, setCode] = useState('')

  function goJoin() {
    if (!joinOpen) { setJoinOpen(true); return }
    if (code.trim().length < 3) return
    router.push(`/rules?intent=join&code=${code.trim().toUpperCase()}`)
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{ position: 'relative', width: '100%', maxWidth: 380 }}>
        {/* ─── Top card · holographic ─── */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #B8E4DF 0%, #C8C4EB 32%, #ECC9DC 66%, #D6E7B6 100%)',
          borderRadius: '26px 26px 6px 6px',
          padding: '42px 28px 44px',
          overflow: 'hidden',
          boxShadow: '0 -2px 0 rgba(0,0,0,0.06)',
        }}>
          {/* perforation dots top corners */}
          <div style={punch(12, 14)} />
          <div style={{ ...punch(12, 14), left: 'auto', right: 14 }} />

          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Image
              src="/facecard-logo.png"
              alt="FaceCard"
              width={240}
              height={150}
              priority
              style={{ width: '70%', maxWidth: 220, height: 'auto' }}
            />
          </div>

          {/* asterisk bottom-left */}
          <div style={{ position: 'absolute', left: 20, bottom: 16, width: 26, height: 26, opacity: 0.9 }}>
            <Image src="/asterisk.svg" alt="" width={26} height={26} />
          </div>
        </div>

        {/* ─── Perforation gap ─── */}
        <PerforatedGap />

        {/* ─── Bottom card · gray ─── */}
        <div style={{
          position: 'relative',
          background: '#D9D9D9',
          borderRadius: '6px 6px 26px 26px',
          padding: '30px 28px 40px',
          overflow: 'visible',
        }}>
          {/* spinner top-right */}
          <div style={{ position: 'absolute', top: 18, right: 20, width: 26, height: 26, opacity: 0.85 }}>
            <Image src="/spinner-ball.svg" alt="" width={26} height={26} />
          </div>

          <h1 style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 20, fontWeight: 700, color: '#000',
            marginBottom: 14, letterSpacing: 0.3,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            It&apos;s Year 2616
            <Image src="/globe-simple.svg" alt="" width={18} height={18} style={{ opacity: 0.9 }} />
          </h1>

          <p style={bodyP}>
            Humanity has been uploaded to the cloud, but the server is struggling.
          </p>
          <p style={{ ...bodyP, marginBottom: 28 }}>
            To save bandwidth, the system is deleting personalities it thinks are NPCs
          </p>

          {joinOpen && (
            <div style={{ marginBottom: 14 }}>
              <input
                autoFocus
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                placeholder="GAME CODE"
                onKeyDown={e => { if (e.key === 'Enter') goJoin() }}
                style={{
                  width: '100%', padding: '14px 18px',
                  background: '#FFF', border: '2px solid #000', borderRadius: 999,
                  fontFamily: "'Departure Mono', 'Space Mono', monospace",
                  fontSize: 20, letterSpacing: 4, color: '#000',
                  textAlign: 'center', outline: 'none',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 2 }}>
            <button
              onClick={goJoin}
              disabled={joinOpen && code.trim().length < 3}
              style={{
                width: '100%', padding: '16px 24px',
                background: '#FF4A1C', border: 'none', borderRadius: 999,
                fontFamily: "'Departure Mono', 'Space Mono', monospace",
                fontSize: 18, color: '#FFF', letterSpacing: 2,
                cursor: 'pointer', opacity: joinOpen && code.trim().length < 3 ? 0.5 : 1,
                boxShadow: '0 4px 0 rgba(0,0,0,0.15)',
              }}
            >
              {joinOpen ? 'ENTER →' : 'JOIN GAME'}
            </button>
            <button
              onClick={() => router.push('/rules?intent=host')}
              style={{
                width: '100%', padding: '16px 24px',
                background: 'transparent', border: '2px solid #000', borderRadius: 999,
                fontFamily: "'Departure Mono', 'Space Mono', monospace",
                fontSize: 18, color: '#000', letterSpacing: 2, cursor: 'pointer',
              }}
            >
              HOST GAME
            </button>
          </div>

          {/* green barcode bottom-right, slightly overlapping outward */}
          <div style={{
            position: 'absolute', right: -10, bottom: -20,
            width: 88, height: 138, zIndex: 3, pointerEvents: 'none',
            filter: 'hue-rotate(72deg) saturate(1.45)',
          }}>
            <Image
              src="/barcode.png"
              alt=""
              width={88}
              height={138}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          </div>
        </div>
      </div>
    </main>
  )
}

function punch(top: number, size: number): React.CSSProperties {
  return {
    position: 'absolute',
    top, left: 14,
    width: size, height: size,
    borderRadius: '50%',
    border: '1.5px solid rgba(0,0,0,0.18)',
    background: 'rgba(0,0,0,0.05)',
  }
}

function PerforatedGap() {
  return (
    <div style={{ position: 'relative', height: 14 }}>
      {/* side semicircle cutouts */}
      <div style={cutout('left')} />
      <div style={cutout('right')} />
      {/* dashed line */}
      <div style={{
        position: 'absolute',
        top: '50%', left: 14, right: 14,
        height: 0,
        borderTop: '2px dashed rgba(0,0,0,0.35)',
        transform: 'translateY(-1px)',
      }} />
    </div>
  )
}

function cutout(side: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'absolute',
    top: '50%', transform: 'translateY(-50%)',
    [side]: -8,
    width: 16, height: 16,
    background: '#000',
    borderRadius: '50%',
  }
}

const bodyP: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 14, color: '#000', lineHeight: 1.5, marginBottom: 12,
}
