'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import logoBlack from '../../../logo/Logo Noir sans Fond.webp'
import sylvyBrain from '../../../logo/Sylvy brain.webp'

type WidthOption = '1/4' | '1/2' | '3/4' | '4/4'
type CardItem = { id: string; width: WidthOption }
type LayoutItem = { card: CardItem; row: number; col: number; index: number }

const WIDTH_SPANS: Record<WidthOption, number> = { '1/4': 1, '1/2': 2, '3/4': 3, '4/4': 4 }
const WIDTH_OPTIONS: WidthOption[] = ['1/4', '1/2', '3/4', '4/4']
const GRID_TOTAL = 4
const CARD_HEIGHT = 231
const GAP = 16

const INITIAL_CARDS: CardItem[] = [
  { id: 'schedule', width: '3/4' },
  { id: 'activity', width: '1/4' },
  { id: 'upload', width: '1/4' },
  { id: 'projects', width: '3/4' },
  { id: 'labmind', width: '1/2' },
  { id: 'tools', width: '1/2' },
  { id: 'profile', width: '1/4' },
]

/* ─── Compute flow-based layout from flat card array ─── */
function computeLayout(cards: CardItem[]): LayoutItem[] {
  const result: LayoutItem[] = []
  let row = 0, col = 0
  cards.forEach((card, index) => {
    const span = WIDTH_SPANS[card.width]
    if (col + span > GRID_TOTAL) { row++; col = 0 }
    result.push({ card, row, col, index })
    col += span
  })
  return result
}

/* ─── Inline SVG Icons ─── */
const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" className="text-[#b0b0b0]" fill="currentColor">
    <path d="M21.33,12.91C21.42,14.46 20.71,15.95 19.44,16.86L20.21,18.35C20.44,18.8 20.47,19.33 20.27,19.8C20.08,20.27 19.69,20.64 19.21,20.8L18.42,21.05C18.25,21.11 18.06,21.14 17.88,21.14C17.37,21.14 16.89,20.91 16.56,20.5L14.44,18C13.55,17.85 12.71,17.47 12,16.9C11.5,17.05 11,17.13 10.5,17.13C9.62,17.13 8.74,16.86 8,16.34C7.47,16.5 6.93,16.57 6.38,16.56C5.59,16.57 4.81,16.41 4.08,16.11C2.65,15.47 1.7,14.07 1.65,12.5C1.57,11.78 1.69,11.05 2,10.39C1.71,9.64 1.68,8.82 1.93,8.06C2.3,7.11 3,6.32 3.87,5.82C4.45,4.13 6.08,3 7.87,3.12C9.47,1.62 11.92,1.46 13.7,2.75C14.12,2.64 14.56,2.58 15,2.58C16.36,2.55 17.65,3.15 18.5,4.22C20.54,4.75 22,6.57 22.08,8.69C22.13,9.8 21.83,10.89 21.22,11.82C21.29,12.18 21.33,12.54 21.33,12.91M16.33,11.5C16.9,11.57 17.35,12 17.35,12.57A1,1 0 0,1 16.35,13.57H15.72C15.4,14.47 14.84,15.26 14.1,15.86C14.35,15.95 14.61,16 14.87,16.07C20,16 19.4,12.87 19.4,12.82C19.34,11.39 18.14,10.27 16.71,10.33A1,1 0 0,1 15.71,9.33A1,1 0 0,1 16.71,8.33C17.94,8.36 19.12,8.82 20.04,9.63C20.09,9.34 20.12,9.04 20.12,8.74C20.06,7.5 19.5,6.42 17.25,6.21C16,3.25 12.85,4.89 12.85,5.81V5.81C12.82,6.04 13.06,6.53 13.1,6.56A1,1 0 0,1 14.1,7.56C14.1,8.11 13.65,8.56 13.1,8.56V8.56C12.57,8.54 12.07,8.34 11.67,8C11.19,8.31 10.64,8.5 10.07,8.56V8.56C9.5,8.61 9.03,8.21 9,7.66C8.92,7.1 9.33,6.61 9.88,6.56C10.04,6.54 10.82,6.42 10.82,5.79V5.79C10.82,5.13 11.07,4.5 11.5,4C10.58,3.75 9.59,4.08 8.59,5.29C6.75,5 6,5.25 5.45,7.2C4.5,7.67 4,8 3.78,9C4.86,8.78 5.97,8.87 7,9.25C7.5,9.44 7.78,10 7.59,10.54C7.4,11.06 6.82,11.32 6.3,11.13C5.57,10.81 4.75,10.79 4,11.07C3.68,11.34 3.68,11.9 3.68,12.34C3.68,13.08 4.05,13.77 4.68,14.17C5.21,14.44 5.8,14.58 6.39,14.57C6.24,14.31 6.11,14.04 6,13.76C5.81,13.22 6.1,12.63 6.64,12.44C7.18,12.25 7.77,12.54 7.96,13.08C8.36,14.22 9.38,15 10.58,15.13C11.95,15.06 13.17,14.25 13.77,13C14,11.62 15.11,11.5 16.33,11.5M18.33,18.97L17.71,17.67L17,17.83L18,19.08L18.33,18.97M13.68,10.36C13.7,9.83 13.3,9.38 12.77,9.33C12.06,9.29 11.37,9.53 10.84,10C10.27,10.58 9.97,11.38 10,12.19A1,1 0 0,0 11,13.19C11.57,13.19 12,12.74 12,12.19C12,11.92 12.07,11.65 12.23,11.43C12.35,11.33 12.5,11.28 12.66,11.28C13.21,11.31 13.68,10.9 13.68,10.36Z" />
  </svg>
)

const SearchIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </svg>
)

const BAR_COLORS = {
  orange: '#D4885C',
  green: '#6B9E6B',
  purple: '#8B7EB8',
} as const

/* ─── Tool Icons ─── */
const GraphIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
)
const StatsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <text x="4" y="18" fontSize="18" fontWeight="bold" fill="white" stroke="none" fontFamily="serif">Σ</text>
  </svg>
)
const ReportsIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)
const LibraryIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    <line x1="12" y1="6" x2="12" y2="13" />
    <polyline points="9 10 12 13 15 10" />
  </svg>
)

/* ─── Data ─── */
const activities = [
  { name: 'Dr Lena', initials: 'DL', action: 'Uploaded new protocol', time: '2m ago', color: '#D4885C' },
  { name: 'Marcus', initials: 'M', action: 'Added a comment', time: '18m ago', color: '#D4885C' },
  { name: 'Kristian', initials: 'K', action: 'Requested access', time: '1h ago', color: '#D4885C' },
]

const projectsList = [
  { name: 'CRISPR-Cas9 Sequence A12', tag: 'Genomics' },
  { name: 'Protein Analysis', tag: 'Proteomics' },
  { name: 'HEK 293 Assay', tag: 'Cell Biology' },
]

const toolsList = [
  { name: 'Graphs', icon: <GraphIcon />, bg: '#D45B5B' },
  { name: 'Stats', icon: <StatsIcon />, bg: '#4A8ED4' },
  { name: 'Reports', icon: <ReportsIcon />, bg: '#D4885C' },
  { name: 'Library', icon: <LibraryIcon />, bg: '#5BA65B' },
]

/* ─── Card Style ─── */
const cardStyle = {
  background: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  boxShadow: '0 1px 3px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.03)',
  border: '0.5px solid rgba(255,255,255,0.6)',
} as const

/* ─── Card Content Components ─── */
function ScheduleContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#2c2c2e]">Schedule</h2>
        <p className="text-[11px] text-[#8e8e93] mt-0.5">This week</p>
      </div>
      <div className="space-y-3 flex-1">
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#8e8e93] w-4 text-right font-medium">M</span>
          <div className="flex-1 h-[22px] relative flex items-center">
            <div className="absolute left-[2%] w-[22%] h-full rounded-[6px]" style={{ background: BAR_COLORS.orange }} />
            <svg className="absolute" style={{ left: '24%', top: '50%', transform: 'translateY(-50%)' }} width="24" height="12" viewBox="0 0 24 12">
              <line x1="0" y1="6" x2="20" y2="6" stroke="#c0c0c0" strokeWidth="1" />
              <polygon points="18,3 24,6 18,9" fill="#c0c0c0" />
            </svg>
            <div className="absolute left-[35%] w-[16%] h-full rounded-[6px]" style={{ background: BAR_COLORS.orange }} />
            <div className="absolute left-[60%] w-[26%] h-full rounded-[6px]" style={{ background: BAR_COLORS.purple }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#8e8e93] w-4 text-right font-medium">T</span>
          <div className="flex-1 h-[22px] relative flex items-center">
            <div className="absolute left-[5%] w-[48%] h-full rounded-[6px]" style={{ background: BAR_COLORS.green }} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-[#8e8e93] w-4 text-right font-medium">W</span>
          <div className="flex-1 h-[22px] relative flex items-center">
            <div className="absolute left-[2%] w-[10%] h-full rounded-[6px]" style={{ background: BAR_COLORS.green }} />
            <div className="absolute left-[16%] w-[32%] h-full rounded-[6px]" style={{ background: BAR_COLORS.orange }} />
            <div className="absolute left-[54%] w-[30%] h-full rounded-[6px]" style={{ background: BAR_COLORS.purple }} />
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: BAR_COLORS.orange }} />
          <span className="text-[10px] text-[#8e8e93]">Preparation</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: BAR_COLORS.green }} />
          <span className="text-[10px] text-[#8e8e93]">Experiment</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-[7px] h-[7px] rounded-full" style={{ background: BAR_COLORS.purple }} />
          <span className="text-[10px] text-[#8e8e93]">Analysis</span>
        </div>
      </div>
    </div>
  )
}

function ActivityContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#2c2c2e]">Activity</h2>
        <p className="text-[11px] text-[#8e8e93] mt-0.5">Recent</p>
      </div>
      <div className="space-y-4 flex-1">
        {activities.map((a, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div
              className="w-[28px] h-[28px] rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-semibold text-white"
              style={{ background: a.color }}
            >
              {a.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[#2c2c2e]">{a.name}</span>
                <span className="text-[10px] text-[#b0b0b5] flex-shrink-0">{a.time}</span>
              </div>
              <p className="text-[11px] text-[#8e8e93] leading-tight mt-0.5">{a.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UploadContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <h2 className="text-[15px] font-semibold text-[#2c2c2e] mb-4">New</h2>
      <div className="flex-1 flex items-center justify-center -mt-4">
        <button className="w-[56px] h-[56px] rounded-full bg-[#e8e8ed]/60 flex items-center justify-center cursor-pointer hover:bg-[#e0e0e5]/80 transition-colors duration-200">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function ProjectsContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <div className="mb-3">
        <h2 className="text-[15px] font-semibold text-[#2c2c2e]">Projects</h2>
        <p className="text-[11px] text-[#8e8e93] mt-0.5">3 active</p>
      </div>
      <div className="divide-y divide-[#f0f0f2] flex-1">
        {projectsList.map((p, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2.5 cursor-pointer hover:bg-black/[0.015] -mx-2 px-2 rounded-[8px] transition-colors duration-150"
          >
            <span className="text-[13px] font-medium text-[#2c2c2e]">{p.name}</span>
            <span className="text-[11px] text-[#8e8e93] italic">{p.tag}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ToolsContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <h2 className="text-[15px] font-semibold text-[#2c2c2e] mb-4">Sylvy Tools</h2>
      <div className="flex items-center justify-center gap-10 flex-1">
        {toolsList.map((t, i) => (
          <button
            key={i}
            className="flex flex-col items-center gap-2 cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center"
              style={{
                background: t.bg,
                boxShadow: `0 2px 8px ${t.bg}40, 0 1px 2px rgba(0,0,0,0.1)`,
              }}
            >
              {t.icon}
            </div>
            <span className="text-[11px] text-[#6e6e73] font-medium">{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function ProfileContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <h2 className="text-[15px] font-semibold text-[#2c2c2e]">Profile</h2>
      <div className="flex-1 flex flex-col items-center justify-center -mt-1">
        <div
          className="w-[72px] h-[72px] rounded-full overflow-hidden mb-3"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/profile.jpg" alt="Clément Djezvedjian" className="w-full h-full object-cover" />
        </div>
        <p className="text-[13px] font-semibold text-[#2c2c2e] text-center leading-tight">Clément Djezvedjian</p>
        <p className="text-[11px] text-[#8e8e93] mt-0.5">PhD</p>
      </div>
    </div>
  )
}

function LabmindContent() {
  return (
    <div className="h-full flex flex-col p-5">
      <h2 className="text-[15px] font-semibold text-[#2c2c2e]">Labmind</h2>
      <div className="flex-1 flex items-center justify-center">
        <Image src={sylvyBrain} alt="Sylvy brain" width={80} height={80} className="object-contain" />
      </div>
    </div>
  )
}

const CARD_CONTENT: Record<string, () => React.ReactNode> = {
  schedule: () => <ScheduleContent />,
  activity: () => <ActivityContent />,
  upload: () => <UploadContent />,
  projects: () => <ProjectsContent />,
  tools: () => <ToolsContent />,
  labmind: () => <LabmindContent />,
  profile: () => <ProfileContent />,
}

/* ─── Spring config for layout animations ─── */
const LAYOUT_SPRING = { type: 'spring' as const, stiffness: 400, damping: 34, mass: 0.8 }

/* ─── Dashboard Component ─── */
function Dashboard() {
  const router = useRouter()
  const [searchFocused, setSearchFocused] = useState(false)
  const [editing, setEditing] = useState(false)
  const [cards, setCards] = useState<CardItem[]>(() => {
    if (typeof window !== 'undefined') {
      /* Try new flat format first */
      const saved = localStorage.getItem('sylvy-demo-layout-v2')
      if (saved) {
        try { return JSON.parse(saved) } catch { /* fall through */ }
      }
      /* Migrate from old row-based format */
      const old = localStorage.getItem('sylvy-demo-layout')
      if (old) {
        try {
          const rows = JSON.parse(old)
          return (rows as { id: string; width: WidthOption }[][]).flat().map(({ id, width }) => ({ id, width }))
        } catch { /* fall through */ }
      }
    }
    return INITIAL_CARDS
  })
  const [wiggling, setWiggling] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)
  const isResizing = useRef(false)
  const cardsRef = useRef(cards)
  cardsRef.current = cards

  /* Entrance animation phase — layout animations activate after entrance completes */
  const [entranceDone, setEntranceDone] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setEntranceDone(true), 1600)
    return () => clearTimeout(t)
  }, [])

  /* Drag state */
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [dragSize, setDragSize] = useState({ w: 0, h: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  /* Computed layout from flat card array */
  const layout = useMemo(() => computeLayout(cards), [cards])

  /* Persist layout to localStorage */
  useEffect(() => {
    localStorage.setItem('sylvy-demo-layout-v2', JSON.stringify(cards))
  }, [cards])

  /* Wiggle every 5s while editing */
  useEffect(() => {
    if (!editing) { setWiggling(false); return }
    setWiggling(true)
    const interval = setInterval(() => {
      setWiggling(true)
      setTimeout(() => setWiggling(false), 600)
    }, 5000)
    const initialTimeout = setTimeout(() => setWiggling(false), 600)
    return () => { clearInterval(interval); clearTimeout(initialTimeout) }
  }, [editing])

  /* Resize by dragging edge — snaps to 1/4, 1/2, 3/4, 4/4 */
  const handleResizeStart = useCallback((e: React.PointerEvent, cardId: string, edge: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true

    const startX = e.clientX
    const gridWidth = gridRef.current?.offsetWidth ?? 940
    const colWidth = (gridWidth + GAP) / GRID_TOTAL

    const card = cardsRef.current.find(c => c.id === cardId)
    if (!card) return
    const originalSpan = WIDTH_SPANS[card.width]

    const onMove = (ev: PointerEvent) => {
      const deltaCols = Math.round((ev.clientX - startX) / colWidth)
      const newSpan = edge === 'right'
        ? Math.max(1, Math.min(GRID_TOTAL, originalSpan + deltaCols))
        : Math.max(1, Math.min(GRID_TOTAL, originalSpan - deltaCols))
      if (![1, 2, 3, 4].includes(newSpan)) return
      const newWidth = WIDTH_OPTIONS[newSpan - 1]

      setCards(prev => {
        const idx = prev.findIndex(c => c.id === cardId)
        if (idx === -1 || prev[idx].width === newWidth) return prev
        const next = [...prev]
        next[idx] = { ...next[idx], width: newWidth }
        return next
      })
    }

    const onUp = () => {
      isResizing.current = false
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  /* Drag to reorder — real-time reflow with Framer Motion layout animations */
  const handleDragStart = useCallback((e: React.PointerEvent, cardId: string) => {
    if (isResizing.current) return
    e.preventDefault()

    const el = e.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()

    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setDragSize({ w: rect.width, h: rect.height })
    setDragPos({ x: e.clientX, y: e.clientY })
    setDragId(cardId)
    setDragActive(false)

    const startX = e.clientX
    const startY = e.clientY
    let activated = false

    const onMove = (ev: PointerEvent) => {
      if (!activated && (Math.abs(ev.clientX - startX) > 5 || Math.abs(ev.clientY - startY) > 5)) {
        activated = true
        setDragActive(true)
      }
      setDragPos({ x: ev.clientX, y: ev.clientY })

      if (!activated || !gridRef.current) return

      /* Compute the insertion index from cursor position */
      const gridRect = gridRef.current.getBoundingClientRect()
      const relY = ev.clientY - gridRect.top
      const rowHeight = CARD_HEIGHT + GAP
      const targetRow = Math.max(0, Math.floor(relY / rowHeight))

      const currentCards = cardsRef.current
      const withoutDragged = currentCards.filter(c => c.id !== cardId)
      const layoutWithout = computeLayout(withoutDragged)

      const colWidth = gridRect.width / GRID_TOTAL
      const relX = ev.clientX - gridRect.left

      /* Find cards in the target row */
      const rowCards = layoutWithout.filter(l => l.row === targetRow)

      let insertIndex: number

      if (rowCards.length === 0) {
        /* No cards in this row — insert after all cards in previous rows */
        const prevCards = layoutWithout.filter(l => l.row < targetRow)
        insertIndex = prevCards.length
      } else {
        /* Find insertion point by comparing cursor X to card centers */
        insertIndex = rowCards[rowCards.length - 1].index + 1
        for (const rc of rowCards) {
          const cardCenterX = (rc.col + WIDTH_SPANS[rc.card.width] / 2) * colWidth
          if (relX < cardCenterX) {
            insertIndex = rc.index
            break
          }
        }
      }

      /* Reorder the flat array — Framer Motion layout animations handle the visual */
      setCards(prev => {
        const dragged = prev.find(c => c.id === cardId)
        if (!dragged) return prev
        const without = prev.filter(c => c.id !== cardId)
        const next = [...without]
        next.splice(insertIndex, 0, dragged)
        /* Only update state if the order actually changed */
        if (next.every((c, i) => c.id === prev[i]?.id)) return prev
        return next
      })
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      setDragId(null)
      setDragActive(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [])

  const handleDone = useCallback(() => setEditing(false), [])

  return (
    <div
      className="w-full min-h-screen"
      style={{
        background: 'linear-gradient(160deg, #c8ddb8 0%, #b8cfaa 30%, #c2d6b2 60%, #ccdcbc 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      <style>{`
        @keyframes card-wiggle {
          0% { transform: rotate(0deg); }
          15% { transform: rotate(-1.2deg); }
          30% { transform: rotate(1.2deg); }
          45% { transform: rotate(-0.8deg); }
          60% { transform: rotate(0.8deg); }
          75% { transform: rotate(-0.4deg); }
          90% { transform: rotate(0.4deg); }
          100% { transform: rotate(0deg); }
        }
        .card-wiggle {
          animation: card-wiggle 0.5s ease-in-out;
        }
      `}</style>

      <div className="mx-auto max-w-[940px] px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -12, filter: 'blur(8px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 mb-6"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image src={logoBlack} alt="Sylvy" width={28} height={28} className="object-contain" />
          </motion.div>
          <h1 className="text-[24px] font-semibold text-[#2c2c2e] tracking-tight">
            Sylvy Workspace
          </h1>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center rounded-[14px] px-4 py-6 mb-6 cursor-text transition-shadow duration-200"
          style={{
            ...cardStyle,
            ...(searchFocused ? {
              boxShadow: '0 2px 8px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.05)',
              background: 'rgba(255,255,255,0.92)',
            } : {}),
          }}
        >
          <SearchIcon />
          <input
            type="text"
            placeholder="Ask Sylvy Labmind"
            className="ml-2.5 flex-1 bg-transparent text-[14px] text-[#2c2c2e] placeholder-[#8e8e93] outline-none"
            style={{ fontFamily: 'inherit' }}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-[#d5d5da]" />
            <BrainIcon />
          </div>
        </motion.div>

        {/* Card Grid — single CSS grid, cards reflow via Framer Motion layout */}
        <LayoutGroup>
          <motion.div
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${GRID_TOTAL}, 1fr)`,
              gridAutoRows: CARD_HEIGHT,
              gap: GAP,
            }}
          >
            {layout.map((item, i) => {
              const { card, row, col } = item
              const span = WIDTH_SPANS[card.width]
              const isBeingDragged = dragId === card.id && dragActive
              const entranceDelay = 0.3 + i * 0.08

              return (
                <motion.div
                  key={card.id}
                  layout={entranceDone}
                  initial={{ opacity: 0, scale: 0.92, filter: 'blur(8px)' }}
                  animate={{
                    opacity: isBeingDragged ? 0 : 1,
                    scale: isBeingDragged ? 0.97 : 1,
                    filter: 'blur(0px)',
                  }}
                  transition={
                    entranceDone
                      ? {
                          layout: LAYOUT_SPRING,
                          opacity: { duration: 0.15 },
                          scale: { duration: 0.15 },
                          filter: { duration: 0.2 },
                        }
                      : {
                          delay: entranceDelay,
                          duration: 0.6,
                          ease: [0.22, 1, 0.36, 1],
                        }
                  }
                  className={`rounded-[16px] overflow-hidden relative select-none ${
                    wiggling && !dragId ? 'card-wiggle' : ''
                  }`}
                  style={{
                    ...cardStyle,
                    gridRow: row + 1,
                    gridColumn: `${col + 1} / span ${span}`,
                    cursor: editing ? (isBeingDragged ? 'grabbing' : 'grab') : 'default',
                    willChange: entranceDone ? 'transform' : 'auto',
                    ...(editing && !isBeingDragged ? {
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05), 0 0 0 2px rgba(0,0,0,0.04)',
                    } : {}),
                    animationDelay: wiggling ? `${(card.id.charCodeAt(0) % 5) * 30}ms` : '0ms',
                  }}
                  onPointerDown={editing ? (e) => handleDragStart(e, card.id) : undefined}
                  onClick={
                    !editing && card.id === 'projects' ? () => router.push('/demo/projects')
                    : !editing && card.id === 'upload' ? () => router.push('/demo/new-experiment')
                    : !editing && card.id === 'labmind' ? () => router.push('/demo/labmind')
                    : undefined
                  }
                >
                  {CARD_CONTENT[card.id]?.()}

                  {/* Resize handles */}
                  {editing && (
                    <>
                      <div
                        className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize z-20 group"
                        onPointerDown={(e) => handleResizeStart(e, card.id, 'left')}
                      >
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full bg-[#a0a0a5] opacity-0 group-hover:opacity-80 transition-opacity duration-150" />
                      </div>
                      <div
                        className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize z-20 group"
                        onPointerDown={(e) => handleResizeStart(e, card.id, 'right')}
                      >
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-[3px] h-8 rounded-full bg-[#a0a0a5] opacity-0 group-hover:opacity-80 transition-opacity duration-150" />
                      </div>
                    </>
                  )}
                </motion.div>
              )
            })}
          </motion.div>
        </LayoutGroup>

        {/* Floating drag overlay — follows cursor precisely, no lag */}
        <AnimatePresence>
          {dragId && dragActive && (
            <motion.div
              initial={{ scale: 1, opacity: 0.9 }}
              animate={{ scale: 1.025, opacity: 1 }}
              exit={{ scale: 1, opacity: 0 }}
              transition={{
                scale: { type: 'spring', stiffness: 500, damping: 30 },
                opacity: { duration: 0.12 },
              }}
              className="fixed pointer-events-none z-[9999] rounded-[16px] overflow-hidden"
              style={{
                left: dragPos.x - dragOffset.x,
                top: dragPos.y - dragOffset.y,
                width: dragSize.w,
                height: dragSize.h,
                ...cardStyle,
                background: 'rgba(255,255,255,0.95)',
                boxShadow: '0 22px 70px rgba(0,0,0,0.14), 0 8px 22px rgba(0,0,0,0.10), 0 0 0 0.5px rgba(255,255,255,0.5)',
              }}
            >
              {CARD_CONTENT[dragId]?.()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modify / Done button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="flex justify-center mt-5 pb-8"
        >
          <button
            onClick={() => editing ? handleDone() : setEditing(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] text-[12px] font-medium cursor-pointer transition-all duration-200"
            style={{
              background: editing ? 'rgba(44,44,46,0.85)' : 'rgba(255,255,255,0.5)',
              color: editing ? '#fff' : '#6e6e73',
              border: editing ? '0.5px solid rgba(255,255,255,0.1)' : '0.5px solid rgba(0,0,0,0.06)',
            }}
          >
            {editing ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Done
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                </svg>
                Modify
              </>
            )}
          </button>
        </motion.div>
      </div>
    </div>
  )
}

/* ─── Main Demo Page ─── */
export default function DemoPage() {
  return <Dashboard />
}
