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
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 380,
        background: '#D9D9D9',
        borderRadius: 24,
        padding: '40px 32px 48px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <Image
            src="/facecard-logo.png"
            alt="FaceCard"
            width={220}
            height={140}
            priority
            style={{ width: '100%', maxWidth: 240, height: 'auto' }}
          />
        </div>

        <h1 style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 20, fontWeight: 700, color: '#000',
          marginBottom: 14, letterSpacing: 0.3,
        }}>
          It's Year 2616
        </h1>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 14, color: '#000', lineHeight: 1.5, marginBottom: 12,
        }}>
          Humanity has been uploaded to the cloud, but the server is struggling.
        </p>
        <p style={{
          fontFamily: "'Space Mono', monospace",
          fontSize: 14, color: '#000', lineHeight: 1.5, marginBottom: 28,
        }}>
          To save bandwidth, the system is deleting personalities it thinks are NPCs
        </p>

        {joinOpen && (
          <div style={{ marginBottom: 14 }}>
            <input
              autoFocus
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
              placeholder="GAME CODE"
              style={{
                width: '100%', padding: '14px 18px',
                background: '#FFF', border: '2px solid #000', borderRadius: 999,
                fontFamily: "'Departure Mono', 'Space Mono', monospace",
                fontSize: 20, letterSpacing: 4, color: '#000',
                textAlign: 'center', outline: 'none',
              }}
              onKeyDown={e => { if (e.key === 'Enter') goJoin() }}
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
              background: 'transparent', border: '2px solid #FFF', borderRadius: 999,
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 18, color: '#FFF', letterSpacing: 2, cursor: 'pointer',
            }}
          >
            HOST GAME
          </button>
        </div>

        <div style={{
          position: 'absolute', right: -10, bottom: -28,
          width: 92, height: 150, zIndex: 1, pointerEvents: 'none',
        }}>
          <Image src="/barcode.png" alt="" width={92} height={150}
            style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
      </div>
    </main>
  )
}
