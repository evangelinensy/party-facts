'use client'

export function FactBox({ fact }: { fact: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-xl">
      <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">The Fact</p>
      <p className="text-2xl font-bold text-gray-900 leading-snug">{fact}</p>
    </div>
  )
}
