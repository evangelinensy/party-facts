'use client'
import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function RulesPage() {
  return (
    <Suspense fallback={null}>
      <RulesInner />
    </Suspense>
  )
}

function RulesInner() {
  const router = useRouter()
  const params = useSearchParams()
  const intent = params?.get('intent') === 'host' ? 'host' : 'join'
  const code = params?.get('code') ?? ''

  function goNext() {
    if (intent === 'host') {
      router.push('/enter?tab=host')
    } else {
      router.push(`/enter?tab=join&code=${code}`)
    }
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#000',
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 16px 120px',
      position: 'relative',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 380,
        background: '#D9D9D9',
        borderRadius: 24,
        padding: '32px 28px 40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.4)',
      }}>
        <h1 style={{
          fontFamily: "'Departure Mono', 'Space Mono', monospace",
          fontSize: 26,
          color: '#000',
          textAlign: 'center',
          letterSpacing: 3,
          marginBottom: 28,
        }}>
          HOW IT WORKS
        </h1>

        <Rule title="Drop your fact">
          Share one unexpected true fact about yourself.
        </Rule>

        <Rule title="Your group goes on stage">
          One group on stage at a time. 60 seconds per person. The crowd asks anything. You answer all questions, no lying.
        </Rule>

        <Rule title="Guess the face behind the fact">
          One fact per person appears on screen. Pick who owns each fact.
        </Rule>

        <Rule title="The reveal" last>
          Fact owner revealed. Correct guess = 1 point.
        </Rule>
      </div>

      {/* Sticky floating CTA */}
      <div style={{
        position: 'fixed',
        left: 0, right: 0, bottom: 0,
        padding: '18px 16px 24px',
        display: 'flex', justifyContent: 'center',
        background: 'linear-gradient(to top, rgba(0,0,0,0.95) 40%, rgba(0,0,0,0))',
        pointerEvents: 'none',
        zIndex: 10,
      }}>
        <button
          onClick={goNext}
          style={{
            pointerEvents: 'auto',
            width: '100%', maxWidth: 260,
            padding: '16px 28px',
            background: '#FF4A1C',
            border: 'none',
            borderRadius: 999,
            fontFamily: "'Departure Mono', 'Space Mono', monospace",
            fontSize: 18,
            color: '#FFF',
            letterSpacing: 3,
            cursor: 'pointer',
            boxShadow: '0 6px 0 rgba(0,0,0,0.25), 0 12px 24px rgba(255,74,28,0.35)',
          }}
        >
          LET&apos;S GO
        </button>
      </div>
    </main>
  )
}

function Rule({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <div style={{ marginBottom: last ? 0 : 22 }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 16, fontWeight: 700, color: '#000',
        marginBottom: 4,
      }}>{title}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 14, color: '#000', lineHeight: 1.5,
      }}>{children}</div>
    </div>
  )
}
