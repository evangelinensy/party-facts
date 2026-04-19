'use client'
import { Suspense, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { GROUPS } from '@/lib/design'

type Tab = 'join' | 'host'

export default function EnterPage() {
  return (
    <Suspense fallback={null}>
      <EnterInner />
    </Suspense>
  )
}

function EnterInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTab: Tab = searchParams?.get('tab') === 'host' ? 'host' : 'join'
  const initialCode = (searchParams?.get('code') ?? '').toUpperCase()
  const [tab] = useState<Tab>(initialTab)

  // Join state
  const [step, setStep] = useState<1 | 2>(1)
  const [code] = useState(initialCode)
  const [name, setName] = useState('')
  const [group, setGroup] = useState<string | null>(null)
  const [fact, setFact] = useState('')
  const [factPrefilled, setFactPrefilled] = useState(false)
  const [photo, setPhoto] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const lookupRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)

  // Host state
  const [hostName, setHostName] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [hosting, setHosting] = useState(false)
  const [hostError, setHostError] = useState('')

  const canAdvanceStep1 = !!name.trim() && !!group && fact.trim().length > 5

  useEffect(() => {
    if (lookupRef.current) clearTimeout(lookupRef.current)
    if (!code || !name.trim() || !group) return
    lookupRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/games/${code}/lookup?name=${encodeURIComponent(name.trim())}&group=${group}`)
        if (res.ok) {
          const data = await res.json()
          if (data.fact) { setFact(data.fact); setFactPrefilled(true) }
        }
      } catch {}
    }, 500)
  }, [code, name, group])

  async function compressImage(file: File): Promise<string> {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader()
      r.onload = () => resolve(r.result as string)
      r.onerror = reject
      r.readAsDataURL(file)
    })
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new window.Image()
      im.onload = () => resolve(im)
      im.onerror = reject
      im.src = dataUrl
    })
    const MAX = 480
    const scale = Math.min(1, MAX / Math.max(img.width, img.height))
    const w = Math.round(img.width * scale)
    const h = Math.round(img.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w; canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, 0, 0, w, h)
    return canvas.toDataURL('image/jpeg', 0.72)
  }

  async function onPickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    try {
      const compressed = await compressImage(f)
      setPhoto(compressed)
    } catch {}
    e.target.value = ''
  }

  async function handleJoin() {
    if (!canAdvanceStep1) return
    setJoinError(''); setJoining(true)
    try {
      const res = await fetch(`/api/games/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, group, fact, photo: photo ?? undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Failed to join'); return }
      localStorage.setItem('pf_identity', JSON.stringify({
        playerId: data.playerId, playerToken: data.playerToken,
        playerName: name, playerGroup: group,
        gameCode: code, isHost: false,
      }))
      router.push(`/lobby/${code}`)
    } catch { setJoinError('Network error') }
    finally { setJoining(false) }
  }

  async function handleHost(e: React.FormEvent) {
    e.preventDefault()
    setHostError(''); setHosting(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, customCode: customCode.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setHostError(data.error ?? 'Failed to create game'); return }
      localStorage.setItem('pf_identity', JSON.stringify({
        hostToken: data.hostToken, hostName, gameCode: data.code, isHost: true,
      }))
      router.push(`/setup/${data.code}`)
    } catch { setHostError('Network error') }
    finally { setHosting(false) }
  }

  if (tab === 'host') return <HostScreen {...{ hostName, setHostName, customCode, setCustomCode, hosting, hostError, handleHost, back: () => router.push('/') }} />

  // JOIN FLOW
  if (!code) {
    return (
      <Shell>
        <p style={txt.body}>Missing game code.</p>
        <PillBtn onClick={() => router.push('/')}>← BACK</PillBtn>
      </Shell>
    )
  }

  if (step === 1) return (
    <Shell>
      <Header code={code} onBack={() => router.push('/')} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
        <Field label="YOUR NAME">
          <PillInput value={name} onChange={v => setName(v)} placeholder="" maxLength={24} />
        </Field>

        <Field label="YOUR GROUP">
          <div style={{ display: 'flex', gap: 10 }}>
            {Object.entries(GROUPS).map(([k, g]) => {
              const sel = group === k
              return (
                <button key={k} type="button" onClick={() => setGroup(k)} style={{
                  flex: 1, aspectRatio: '1 / 1', borderRadius: 12,
                  background: sel ? g.color : '#D9D9D9',
                  border: sel ? `3px solid #FFF` : `3px solid transparent`,
                  fontFamily: "'Departure Mono', 'Space Mono', monospace",
                  fontSize: 28, color: sel ? '#FFF' : g.color,
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>{k}</button>
              )
            })}
          </div>
        </Field>

        <Field label="YOUR UNEXPECTED FACT">
          <textarea
            value={fact}
            onChange={e => { setFact(e.target.value); setFactPrefilled(false) }}
            rows={5}
            style={{
              width: '100%', padding: '14px 18px',
              background: '#D9D9D9', border: 'none', borderRadius: 18,
              fontFamily: "'Space Mono', monospace", fontSize: 13, color: '#000',
              resize: 'none', lineHeight: 1.55, outline: 'none', minHeight: 120,
            }}
          />
          {factPrefilled && <div style={{ ...txt.hint, color: '#6AD06A', marginTop: 6 }}>PRE-FILLED ✓</div>}
        </Field>

        {joinError && <div style={{ ...txt.hint, color: '#FF6B6B' }}>{joinError}</div>}
      </div>

      <div style={{ marginTop: 24 }}>
        <PillBtn
          onClick={() => setStep(2)}
          disabled={!canAdvanceStep1}
          color="#FF4A1C"
        >
          NEXT: PHOTO
        </PillBtn>
      </div>
    </Shell>
  )

  // STEP 2 — PHOTO
  return (
    <Shell>
      <Header code={code} onBack={() => setStep(1)} />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onPickPhoto}
        style={{ display: 'none' }}
      />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '12px 0' }}>
        {!photo ? (
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '4 / 5',
            margin: '0 auto', maxWidth: 340,
          }}>
            <Image src="/frame-decoration.png" alt="" fill style={{ objectFit: 'fill' }} />
          </div>
        ) : (
          <div style={{
            position: 'relative', width: '100%', aspectRatio: '4 / 5',
            margin: '0 auto', maxWidth: 340, background: '#000',
          }}>
            <img src={photo} alt="" style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            }} />
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 28,
              backgroundImage: 'url(/checker-top.png)',
              backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x',
            }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
              backgroundImage: 'url(/checker-bottom.png)',
              backgroundSize: 'auto 100%', backgroundRepeat: 'repeat-x',
            }} />
            <div style={{
              position: 'absolute', left: 0, right: 0, bottom: 40,
              textAlign: 'center',
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 22, color: '#FFF', letterSpacing: 2,
              textShadow: '2px 2px 0 #000',
            }}>{name}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
        {!photo ? (
          <>
            <PillBtn onClick={() => fileRef.current?.click()} color="#FF4A1C">UPLOAD PHOTO</PillBtn>
            <PillBtn onClick={handleJoin} disabled={joining} outline>{joining ? 'JOINING…' : 'SKIP'}</PillBtn>
          </>
        ) : (
          <>
            <PillBtn onClick={handleJoin} disabled={joining} color="#FF4A1C">{joining ? 'JOINING…' : 'NEXT'}</PillBtn>
            <PillBtn onClick={() => fileRef.current?.click()} outline>REUPLOAD</PillBtn>
          </>
        )}
        {joinError && <div style={{ ...txt.hint, color: '#FF6B6B', textAlign: 'center' }}>{joinError}</div>}
      </div>
    </Shell>
  )
}

/* ---------- helpers ---------- */

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main style={{
      minHeight: '100vh', background: '#000', color: '#FFF',
      display: 'flex', flexDirection: 'column',
      padding: '28px 20px 32px', maxWidth: 460, margin: '0 auto',
    }}>{children}</main>
  )
}

function Header({ code, onBack }: { code: string; onBack: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <button onClick={onBack} style={{
        background: 'none', border: 'none', color: '#FFF', cursor: 'pointer',
        fontFamily: "'Departure Mono', 'Space Mono', monospace", fontSize: 14, letterSpacing: 2,
      }}>← BACK</button>
      <span style={{
        fontFamily: "'Departure Mono', 'Space Mono', monospace",
        fontSize: 14, color: '#FFF', letterSpacing: 3, opacity: 0.7,
      }}>{code}</span>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontFamily: "'Departure Mono', 'Space Mono', monospace",
        fontSize: 14, color: '#FFF', letterSpacing: 2, marginBottom: 8,
      }}>{label}</div>
      {children}
    </div>
  )
}

function PillInput({ value, onChange, placeholder, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; maxLength?: number
}) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      style={{
        width: '100%', padding: '14px 20px',
        background: '#D9D9D9', border: 'none', borderRadius: 999,
        fontFamily: "'Space Mono', monospace", fontSize: 15, color: '#000',
        outline: 'none',
      }}
    />
  )
}

function PillBtn({
  children, onClick, disabled, color, outline, type = 'button',
}: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; color?: string; outline?: boolean;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        width: '100%', padding: '16px 24px',
        background: outline ? 'transparent' : (color ?? '#FF4A1C'),
        border: outline ? '2px solid #FFF' : 'none',
        borderRadius: 999,
        fontFamily: "'Departure Mono', 'Space Mono', monospace",
        fontSize: 18, color: '#FFF', letterSpacing: 2,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        boxShadow: outline ? 'none' : '0 4px 0 rgba(0,0,0,0.25)',
        transition: 'opacity 0.15s',
      }}
    >{children}</button>
  )
}

const txt = {
  body: { fontFamily: "'Space Mono', monospace", fontSize: 14, color: '#FFF' },
  hint: { fontFamily: "'Space Mono', monospace", fontSize: 11, color: '#888', letterSpacing: 1 },
} as const

/* ---------- Host Screen ---------- */

function HostScreen(props: {
  hostName: string; setHostName: (s: string) => void;
  customCode: string; setCustomCode: (s: string) => void;
  hosting: boolean; hostError: string;
  handleHost: (e: React.FormEvent) => void; back: () => void;
}) {
  return (
    <Shell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={props.back} style={{
          background: 'none', border: 'none', color: '#FFF', cursor: 'pointer',
          fontFamily: "'Departure Mono', 'Space Mono', monospace", fontSize: 14, letterSpacing: 2,
        }}>← BACK</button>
        <span style={{
          fontFamily: "'Departure Mono', 'Space Mono', monospace",
          fontSize: 14, color: '#FFF', letterSpacing: 3, opacity: 0.7,
        }}>HOST</span>
      </div>

      <form onSubmit={props.handleHost} style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>
        <Field label="YOUR NAME">
          <PillInput value={props.hostName} onChange={props.setHostName} placeholder="First name" maxLength={24} />
        </Field>

        <Field label="CUSTOM GAME CODE (OPTIONAL)">
          <input
            value={props.customCode}
            onChange={e => props.setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
            placeholder="e.g. SAMS25"
            style={{
              width: '100%', padding: '14px 20px',
              background: '#D9D9D9', border: 'none', borderRadius: 999,
              fontFamily: "'Departure Mono', 'Space Mono', monospace",
              fontSize: 22, letterSpacing: 4, color: '#000', textAlign: 'center',
              outline: 'none',
            }}
          />
          <div style={{ ...txt.hint, marginTop: 6 }}>3–8 LETTERS/NUMBERS · BLANK = AUTO</div>
        </Field>

        <div style={{
          padding: '12px 14px', border: '1px dashed #444', borderRadius: 12,
          fontFamily: "'Space Mono', monospace", fontSize: 12, color: '#AAA', lineHeight: 1.6,
        }}>
          As host you run the show — you see the facts, control reveals, and advance rounds.
        </div>

        {props.hostError && <div style={{ ...txt.hint, color: '#FF6B6B' }}>{props.hostError}</div>}

        <div style={{ marginTop: 'auto' }}>
          <PillBtn
            type="submit"
            disabled={props.hosting || props.hostName.trim().length < 2}
            color="#FF4A1C"
          >
            {props.hosting ? 'CREATING…' : 'CREATE GAME →'}
          </PillBtn>
        </div>
      </form>
    </Shell>
  )
}
