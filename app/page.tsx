'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

type Tab = 'join' | 'host'

export default function HomePage() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('join')

  // Join state
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [group, setGroup] = useState<'A' | 'B' | 'C' | 'D'>('A')
  const [fact, setFact] = useState('')
  const [factPrefilled, setFactPrefilled] = useState(false)
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const lookupTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Host state
  const [hostName, setHostName] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [hosting, setHosting] = useState(false)
  const [hostError, setHostError] = useState('')

  // Auto-lookup prefilled fact when name + code + group are set
  useEffect(() => {
    if (lookupTimeout.current) clearTimeout(lookupTimeout.current)
    if (!code.trim() || !name.trim() || !group) {
      if (factPrefilled) { setFact(''); setFactPrefilled(false) }
      return
    }
    lookupTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/games/${code.toUpperCase()}/lookup?name=${encodeURIComponent(name.trim())}&group=${group}`
        )
        if (res.ok) {
          const data = await res.json()
          if (data.fact) {
            setFact(data.fact)
            setFactPrefilled(true)
          } else if (factPrefilled) {
            setFact('')
            setFactPrefilled(false)
          }
        }
      } catch {}
    }, 500)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, name, group])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    setJoinError('')
    setJoining(true)
    try {
      const res = await fetch(`/api/games/${code.toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, group, fact }),
      })
      const data = await res.json()
      if (!res.ok) { setJoinError(data.error ?? 'Failed to join'); return }
      localStorage.setItem('pf_identity', JSON.stringify({
        playerId: data.playerId,
        playerToken: data.playerToken,
        playerName: name,
        playerGroup: group,
        gameCode: code.toUpperCase(),
        isHost: false,
      }))
      router.push(`/lobby/${code.toUpperCase()}`)
    } catch {
      setJoinError('Network error')
    } finally {
      setJoining(false)
    }
  }

  async function handleHost(e: React.FormEvent) {
    e.preventDefault()
    setHostError('')
    setHosting(true)
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostName, customCode: customCode.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setHostError(data.error ?? 'Failed to create game'); return }
      localStorage.setItem('pf_identity', JSON.stringify({
        hostToken: data.hostToken,
        hostName,
        gameCode: data.code,
        isHost: true,
      }))
      router.push(`/setup/${data.code}`)
    } catch {
      setHostError('Network error')
    } finally {
      setHosting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-white mb-2">Party Facts</h1>
          <p className="text-white/60">Guess who said what</p>
        </div>

        <div className="bg-white/10 backdrop-blur rounded-2xl overflow-hidden">
          <div className="flex">
            {(['join', 'host'] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-4 text-base font-semibold transition-all ${tab === t ? 'bg-white text-gray-900' : 'text-white/70 hover:text-white'}`}
              >
                {t === 'join' ? 'Join Game' : 'Host Game'}
              </button>
            ))}
          </div>

          <div className="p-6">
            {tab === 'join' ? (
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Game Code</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 text-xl font-bold uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="XXXXX"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    maxLength={8}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Your Name</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Alex"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">Your Group</label>
                  <select
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={group}
                    onChange={e => setGroup(e.target.value as 'A' | 'B' | 'C' | 'D')}
                  >
                    {['A', 'B', 'C', 'D'].map(g => (
                      <option key={g} value={g} className="bg-gray-900">Group {g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white/70 text-sm">Your Unexpected Fact</label>
                    {factPrefilled && (
                      <span className="text-emerald-400 text-xs font-medium">Pre-filled by host ✓</span>
                    )}
                  </div>
                  <textarea
                    className={`w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none ${factPrefilled ? 'ring-1 ring-emerald-500/50' : ''}`}
                    placeholder="I once ate 12 hotdogs in one sitting..."
                    value={fact}
                    onChange={e => { setFact(e.target.value); setFactPrefilled(false) }}
                    rows={3}
                    required
                  />
                </div>
                {joinError && <p className="text-red-400 text-sm">{joinError}</p>}
                <button
                  type="submit"
                  disabled={joining}
                  className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white font-bold text-lg rounded-xl transition-all min-h-[56px]"
                >
                  {joining ? 'Joining...' : 'Join Game'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleHost} className="space-y-4">
                <div>
                  <label className="block text-white/70 text-sm mb-1">Your Name (Host)</label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="Sam"
                    value={hostName}
                    onChange={e => setHostName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-white/70 text-sm mb-1">
                    Custom Game Code <span className="text-white/40">(optional)</span>
                  </label>
                  <input
                    className="w-full px-4 py-3 rounded-xl bg-white/10 text-white placeholder-white/30 uppercase tracking-widest font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    placeholder="e.g. SAMS25"
                    value={customCode}
                    onChange={e => setCustomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    maxLength={8}
                  />
                  <p className="text-white/30 text-xs mt-1">3–8 letters/numbers. Leave blank to auto-generate.</p>
                </div>
                {hostError && <p className="text-red-400 text-sm">{hostError}</p>}
                <button
                  type="submit"
                  disabled={hosting}
                  className="w-full py-4 bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-white font-bold text-lg rounded-xl transition-all min-h-[56px]"
                >
                  {hosting ? 'Creating...' : 'Create Game →'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
