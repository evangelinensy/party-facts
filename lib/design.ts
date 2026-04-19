// Design tokens — keep in sync with the FaceCard v2 design
export const PAPER = '#F0E5CC'
export const INK   = '#16100A'
export const INK2  = '#5A4A38'
export const INK3  = '#9A8870'
export const DASH  = '#C8B898'

export const GROUPS: Record<string, { color: string; bg: string; defaultName: string }> = {
  A: { color: '#4540C0', bg: '#4540C015', defaultName: 'Group A' },
  B: { color: '#0C7A52', bg: '#0C7A5215', defaultName: 'Group B' },
  C: { color: '#B83518', bg: '#B8351815', defaultName: 'Group C' },
  D: { color: '#982B5A', bg: '#982B5A15', defaultName: 'Group D' },
}

export const CORRECT = '#186A32'
export const WRONG   = '#8B1A1A'

export const BG_CONFIG: Record<string, { photo: string; overlay: string; tint: string }> = {
  home:        { photo: '1516450360452-9312f5e86fc7', overlay: 'rgba(20,8,0,0.55)',  tint: 'rgba(80,30,0,0.35)' },
  lobby:       { photo: '1529156069898-49953e39b3ac', overlay: 'rgba(0,10,20,0.55)', tint: 'rgba(0,30,60,0.3)' },
  onstage:     { photo: '1514320291840-2e0a9bf2a9ae', overlay: 'rgba(20,0,0,0.55)',  tint: 'rgba(100,10,0,0.4)' },
  audience:    { photo: '1429962714451-bb934ecdc4ec', overlay: 'rgba(8,0,20,0.6)',   tint: 'rgba(40,10,80,0.35)' },
  host:        { photo: '1598387993441-a364f854c3e1', overlay: 'rgba(0,12,4,0.6)',   tint: 'rgba(0,50,20,0.3)' },
  social:      { photo: '1543807535-eceef0bc6599',   overlay: 'rgba(18,6,0,0.5)',    tint: 'rgba(80,30,10,0.3)' },
  leaderboard: { photo: '1492684223066-81342ee5ff30', overlay: 'rgba(12,8,0,0.5)',   tint: 'rgba(80,60,0,0.3)' },
  setup:       { photo: '1598387993441-a364f854c3e1', overlay: 'rgba(0,12,4,0.6)',   tint: 'rgba(0,50,20,0.3)' },
}
