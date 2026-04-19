'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { VintageBg } from '@/components/VintageBg'
import { Paper } from '@/components/Paper'
import { Dash } from '@/components/Dash'
import { ReceiptLabel } from '@/components/ReceiptLabel'
import { BigStamp } from '@/components/BigStamp'
import { InkBtn } from '@/components/InkBtn'
import { GroupAvatar } from '@/components/GroupAvatar'
import { INK, INK2, DASH, GROUPS } from '@/lib/design'

type Group = 'A' | 'B' | 'C' | 'D'
const GROUP_KEYS: Group[] = ['A', 'B', 'C', 'D']

type GuestRow = { id: string; name: string; groupLetter: Group; fact: string }
type Identity = { isHost: boolean; hostToken?: string; gameCode: string }

export default function SetupPage() {
  const { code } = useParams<{ code: string }>()
  const router = useRouter()
  const [identity, setIdentity] = useState<Identity | null>(null)
  const [groupNames, setGroupNames] = useState<Record<string, string>>({ A: '', B: '', C: '', D: '' })
  const [guests, setGuests] = useState<GuestRow[]>([])
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem('pf_identity')
    if (!raw) { router.push('/'); return }
    const id = JSON.parse(raw) as Identity
    if (!id.isHost) { router.push('/'); return }
    setIdentity(id)

    fetch(`/api/games/${code}/setup`, { headers: { Authorization: `Bearer ${id.hostToken}` } })
      .then(r => r.json())
      .then(data => {
        if (data.groupNames) setGroupNames(n => ({ ...n, ...data.groupNames }))
        if (data.guests?.length) setGuests(data.guests)
      })
      .finally(() => setLoading(false))
  }, [code, router])

  function addGuest() {
    setGuests(g => [...g, { id: crypto.randomUUID(), name: '', groupLetter: 'A', fact: '' }])
  }

  function updateGuest(id: string, field: keyof GuestRow, value: string) {
    setGuests(g => g.map(guest => guest.id === id ? { ...guest, [field]: value } : guest))
  }

  function removeGuest(id: string) {
    setGuests(g => g.filter(guest => guest.id !== id))
  }

  async function handleSave() {
    if (!identity) return
    setSaving(true); setSaveMsg('')
    try {
      const res = await fetch(`/api/games/${code}/setup`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${identity.hostToken}` },
        body: JSON.stringify({ groupNames, guests }),
      })
      if (res.ok) { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000) }
    } finally { setSaving(false) }
  }

  async function handleGoToLobby() {
    await handleSave()
    router.push(`/lobby/${code}`)
  }

  if (loading) return (
    <Screen>
      <p style={{ fontFamily: "'Space Mono', monospace", color: INK2, fontSize: 12 }}>Loading setup…</p>
    </Screen>
  )

  return (
    <Screen>
      <Paper tilt={0.3}>
        <div style={{ textAlign: 'center' }}>
          <BigStamp>GM Setup</BigStamp>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 48, lineHeight: 1, color: INK, letterSpacing: 8 }}>{code}</div>
          <ReceiptLabel center>Configure before players arrive</ReceiptLabel>
        </div>
        <Dash />

        {/* Group Names */}
        <ReceiptLabel>Group names</ReceiptLabel>
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GROUP_KEYS.map(g => {
            const color = GROUPS[g]?.color ?? INK
            return (
              <div key={g} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <GroupAvatar initial={g} color={color} size={32} />
                <input
                  value={groupNames[g] ?? ''}
                  onChange={e => setGroupNames(n => ({ ...n, [g]: e.target.value }))}
                  placeholder={GROUPS[g]?.defaultName ?? `Group ${g}`}
                  maxLength={20}
                  style={{
                    flex: 1, padding: '8px 10px',
                    background: 'transparent', border: `1.5px solid ${DASH}`,
                    fontFamily: "'Space Mono', monospace", fontSize: 13, color: INK,
                    outline: 'none',
                  }}
                />
              </div>
            )
          })}
        </div>
        <Dash />

        {/* Pre-filled Guests */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <ReceiptLabel>Pre-add guests</ReceiptLabel>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: INK2, letterSpacing: 0.5, marginTop: 2 }}>
              Their fact pre-fills on the join form
            </div>
          </div>
          <button onClick={addGuest} style={{
            padding: '6px 14px', border: `2px solid ${INK}`, background: 'transparent',
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: INK,
            letterSpacing: 2, cursor: 'pointer',
          }}>+ ADD</button>
        </div>

        {guests.length === 0 && (
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK2, textAlign: 'center', padding: '12px 0', border: `1px dashed ${DASH}` }}>
            No guests pre-added
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {guests.map((guest, i) => {
            const color = GROUPS[guest.groupLetter]?.color ?? INK
            return (
              <div key={guest.id} style={{ border: `1.5px solid ${DASH}`, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 14, color: INK2, width: 20 }}>{i + 1}</span>
                  <input
                    placeholder="Guest name"
                    value={guest.name}
                    onChange={e => updateGuest(guest.id, 'name', e.target.value)}
                    style={{
                      flex: 1, padding: '6px 8px',
                      background: 'transparent', border: `1.5px solid ${DASH}`,
                      fontFamily: "'Space Mono', monospace", fontSize: 12, color: INK,
                      outline: 'none',
                    }}
                  />
                  <select
                    value={guest.groupLetter}
                    onChange={e => updateGuest(guest.id, 'groupLetter', e.target.value)}
                    style={{
                      padding: '6px 8px', background: color, border: `2px solid ${color}`,
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, color: '#F0E5CC',
                      letterSpacing: 1, cursor: 'pointer', outline: 'none',
                    }}
                  >
                    {GROUP_KEYS.map(g => (
                      <option key={g} value={g} style={{ background: GROUPS[g]?.color ?? '#333' }}>
                        {groupNames[g] ? `${groupNames[g]}` : `Group ${g}`}
                      </option>
                    ))}
                  </select>
                  <button onClick={() => removeGuest(guest.id)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: 20, color: '#8B1A1A',
                    padding: '0 4px', lineHeight: 1,
                  }}>×</button>
                </div>
                <textarea
                  placeholder="Their unexpected fact (optional — they can fill it in themselves)"
                  value={guest.fact}
                  onChange={e => updateGuest(guest.id, 'fact', e.target.value)}
                  rows={2}
                  style={{
                    width: '100%', padding: '8px 10px',
                    background: 'transparent', border: `1.5px solid ${DASH}`,
                    fontFamily: "'Space Mono', monospace", fontSize: 11, color: INK,
                    resize: 'none', lineHeight: 1.6, outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            )
          })}
        </div>

        <Dash />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <InkBtn onClick={handleGoToLobby} disabled={saving}>
            {saving ? 'Saving…' : 'Save & go to lobby →'}
          </InkBtn>
          <button onClick={handleSave} disabled={saving} style={{
            background: 'none', border: `1.5px solid ${DASH}`, cursor: saving ? 'default' : 'pointer',
            fontFamily: "'Space Mono', monospace", fontSize: 11, color: saveMsg ? '#186A32' : INK2,
            letterSpacing: 1, textTransform: 'uppercase', padding: '10px 0', textAlign: 'center',
          }}>
            {saveMsg || (saving ? 'Saving…' : 'Save only')}
          </button>
        </div>

        <div style={{ marginTop: 8, fontFamily: "'Space Mono', monospace", fontSize: 10, color: INK2, textAlign: 'center', letterSpacing: 0.5 }}>
          You can return to this page from the lobby
        </div>
      </Paper>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '56px 12px 40px' }}>
      <VintageBg screen="setup" />
      {children}
    </main>
  )
}
