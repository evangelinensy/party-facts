'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { GroupBadge } from '@/components/GroupBadge'

type Group = 'A' | 'B' | 'C' | 'D'
const GROUPS: Group[] = ['A', 'B', 'C', 'D']

type GuestRow = {
  id: string
  name: string
  groupLetter: Group
  fact: string
}

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

    fetch(`/api/games/${code}/setup`, {
      headers: { Authorization: `Bearer ${id.hostToken}` },
    })
      .then(r => r.json())
      .then(data => {
        if (data.groupNames) {
          setGroupNames(n => ({ ...n, ...data.groupNames }))
        }
        if (data.guests?.length) {
          setGuests(data.guests)
        }
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
    setSaving(true)
    setSaveMsg('')
    try {
      const res = await fetch(`/api/games/${code}/setup`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${identity.hostToken}`,
        },
        body: JSON.stringify({ groupNames, guests }),
      })
      if (res.ok) {
        setSaveMsg('Saved!')
        setTimeout(() => setSaveMsg(''), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleGoToLobby() {
    await handleSave()
    router.push(`/lobby/${code}`)
  }

  if (loading) {
    return (
      <Screen>
        <p className="text-white/60">Loading setup...</p>
      </Screen>
    )
  }

  return (
    <Screen>
      <div className="w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center">
          <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Game Master Setup</p>
          <div className="text-5xl font-black text-white tracking-widest mb-1">{code}</div>
          <p className="text-white/40 text-sm">Configure before players arrive</p>
        </div>

        {/* Group Names */}
        <section className="bg-white/10 rounded-2xl p-5 space-y-3">
          <h2 className="text-white font-bold text-lg">Group Names</h2>
          <p className="text-white/40 text-sm -mt-1">Give each group a fun name. Leave blank to use A/B/C/D.</p>
          <div className="grid grid-cols-2 gap-3">
            {GROUPS.map(g => (
              <div key={g} className="flex items-center gap-2">
                <GroupBadge group={g} />
                <input
                  className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder={`Group ${g}`}
                  value={groupNames[g] ?? ''}
                  onChange={e => setGroupNames(n => ({ ...n, [g]: e.target.value }))}
                  maxLength={20}
                />
              </div>
            ))}
          </div>
        </section>

        {/* Pre-filled Guests */}
        <section className="bg-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-bold text-lg">Pre-add Guests</h2>
              <p className="text-white/40 text-sm">Guests see their fact pre-filled when they join.</p>
            </div>
            <button
              onClick={addGuest}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl text-sm min-h-[44px]"
            >
              + Add
            </button>
          </div>

          {guests.length === 0 && (
            <p className="text-white/30 text-sm text-center py-4">No guests added yet</p>
          )}

          <div className="space-y-3">
            {guests.map((guest, i) => (
              <div key={guest.id} className="bg-white/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white/40 text-xs w-4">{i + 1}</span>
                  <input
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Guest name"
                    value={guest.name}
                    onChange={e => updateGuest(guest.id, 'name', e.target.value)}
                  />
                  <select
                    className="px-3 py-2 rounded-lg bg-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={guest.groupLetter}
                    onChange={e => updateGuest(guest.id, 'groupLetter', e.target.value)}
                  >
                    {GROUPS.map(g => (
                      <option key={g} value={g} className="bg-gray-900">
                        {groupNames[g] ? `${groupNames[g]} (${g})` : `Group ${g}`}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeGuest(guest.id)}
                    className="text-white/40 hover:text-red-400 text-lg leading-none px-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
                    aria-label="Remove guest"
                  >
                    ×
                  </button>
                </div>
                <div className="pl-6">
                  <textarea
                    className="w-full px-3 py-2 rounded-lg bg-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                    placeholder="Their unexpected fact (optional — they can fill it in themselves)"
                    value={guest.fact}
                    onChange={e => updateGuest(guest.id, 'fact', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white font-semibold rounded-xl min-h-[56px] transition-all"
          >
            {saveMsg || (saving ? 'Saving...' : 'Save')}
          </button>
          <button
            onClick={handleGoToLobby}
            disabled={saving}
            className="flex-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white font-bold text-lg rounded-xl min-h-[56px] transition-all"
          >
            Go to Lobby →
          </button>
        </div>

        <p className="text-white/30 text-xs text-center">
          You can come back to this page anytime from the lobby.
        </p>
      </div>
    </Screen>
  )
}

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center p-4 py-12">
      {children}
    </main>
  )
}
