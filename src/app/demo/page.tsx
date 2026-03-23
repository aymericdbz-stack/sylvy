'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import logoBlack from '../../../logo/Logo Noir sans Fond.webp'
type WidthOption = '1/4' | '1/2' | '3/4' | '4/4'
type CardItem = { id: string; width: WidthOption; slot: number }

const WIDTH_SPANS: Record<WidthOption, number> = { '1/4': 1, '1/2': 2, '3/4': 3, '4/4': 4 }
const WIDTH_OPTIONS: WidthOption[] = ['1/4', '1/2', '3/4', '4/4']
const GRID_TOTAL = 4
const CARD_HEIGHT = 231
const GAP = 16

/* ─── Slot helpers ─── */
function canPlace(row: CardItem[], slot: number, span: number, excludeId?: string): boolean {
  if (slot < 0 || slot + span > GRID_TOTAL) return false
  for (const card of row) {
    if (card.id === excludeId) continue
    const cEnd = card.slot + WIDTH_SPANS[card.width] - 1
    if (slot <= cEnd && slot + span - 1 >= card.slot) return false
  }
  return true
}

/* ─── Initial card layout (rows with slots) ─── */
const INITIAL_ROWS: CardItem[][] = [
  [{ id: 'schedule', width: '3/4', slot: 0 }, { id: 'activity', width: '1/4', slot: 3 }],
  [{ id: 'upload', width: '1/4', slot: 0 }, { id: 'projects', width: '3/4', slot: 1 }],
  [{ id: 'tools', width: '4/4', slot: 0 }],
]

/* ─── Inline SVG Icons ─── */
const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7-.5.8-.8 1.7-.8 2.6C6 19.5 7.8 21 10 21.5" stroke="#b0b0b0" />
    <path d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7.5.8.8 1.7.8 2.6 0 2-1.8 3.5-4 4" stroke="#b0b0b0" />
    <path d="M12 2v20" stroke="#c8c8c8" />
    <path d="M8 8h8" stroke="#c8c8c8" />
    <path d="M9 14h6" stroke="#c8c8c8" />
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

const CARD_CONTENT: Record<string, () => React.ReactNode> = {
  schedule: () => <ScheduleContent />,
  activity: () => <ActivityContent />,
  upload: () => <UploadContent />,
  projects: () => <ProjectsContent />,
  tools: () => <ToolsContent />,
}

/* ─── Dashboard Component ─── */
function Dashboard() {
  const router = useRouter()
  const [searchFocused, setSearchFocused] = useState(false)
  const [editing, setEditing] = useState(false)
  const [rows, setRows] = useState<CardItem[][]>(INITIAL_ROWS.map(r => [...r]))
  const [wiggling, setWiggling] = useState(false)
  const gridRef = useRef<HTMLDivElement>(null)

  /* Drag state */
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 })
  const [dragSize, setDragSize] = useState({ w: 0, h: 0 })
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })

  /* Drop target: row + slot */
  const [dropTarget, setDropTarget] = useState<{ rowIdx: number; slot: number } | null>(null)
  const dropTargetRef = useRef<{ rowIdx: number; slot: number } | null>(null)
  dropTargetRef.current = dropTarget

  const rowsRef = useRef(rows)
  rowsRef.current = rows

  /* Resize guard — prevents drag when resizing */
  const isResizing = useRef(false)

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

  /* Change card width (adjust slot if needed) */
  const changeWidth = useCallback((cardId: string, newWidth: WidthOption) => {
    setRows(prev => {
      const next = prev.map(r => [...r])
      for (let ri = 0; ri < next.length; ri++) {
        const ci = next[ri].findIndex(c => c.id === cardId)
        if (ci === -1) continue
        const card = next[ri][ci]
        const newSpan = WIDTH_SPANS[newWidth]
        let newSlot = card.slot
        if (newSlot + newSpan > GRID_TOTAL) newSlot = GRID_TOTAL - newSpan
        if (!canPlace(next[ri], newSlot, newSpan, cardId)) return prev
        next[ri][ci] = { ...card, width: newWidth, slot: newSlot }
        return next
      }
      return prev
    })
  }, [])

  /* Resize by dragging edge — snaps to 1/4, 1/2, 3/4, 4/4 */
  const handleResizeStart = useCallback((e: React.PointerEvent, cardId: string, edge: 'left' | 'right') => {
    e.preventDefault()
    e.stopPropagation()
    isResizing.current = true

    const startX = e.clientX
    const gridWidth = gridRef.current?.offsetWidth ?? 940
    const colWidth = (gridWidth + GAP) / GRID_TOTAL

    /* Find card info */
    const currentRows = rowsRef.current
    let srcRi = -1, srcCi = -1
    for (let ri = 0; ri < currentRows.length; ri++) {
      const ci = currentRows[ri].findIndex(c => c.id === cardId)
      if (ci !== -1) { srcRi = ri; srcCi = ci; break }
    }
    if (srcRi === -1) return
    const originalCard = currentRows[srcRi][srcCi]
    const originalSpan = WIDTH_SPANS[originalCard.width]
    const originalSlot = originalCard.slot

    const onMove = (ev: PointerEvent) => {
      const deltaCols = Math.round((ev.clientX - startX) / colWidth)

      let newSpan: number
      let newSlot: number

      if (edge === 'right') {
        newSpan = Math.max(1, Math.min(GRID_TOTAL, originalSpan + deltaCols))
        newSlot = originalSlot
        /* Clamp so card doesn't exceed grid */
        if (newSlot + newSpan > GRID_TOTAL) newSpan = GRID_TOTAL - newSlot
      } else {
        newSpan = Math.max(1, Math.min(GRID_TOTAL, originalSpan - deltaCols))
        newSlot = originalSlot + (originalSpan - newSpan)
        if (newSlot < 0) { newSpan += newSlot; newSlot = 0 }
      }

      /* Snap to valid WidthOption */
      const validSpans = [1, 2, 3, 4]
      if (!validSpans.includes(newSpan)) return
      const newWidth = WIDTH_OPTIONS[validSpans.indexOf(newSpan)]

      /* Check overlap */
      const row = rowsRef.current[srcRi]
      if (!canPlace(row, newSlot, newSpan, cardId)) return

      setRows(prev => {
        const next = prev.map(r => [...r])
        const ci = next[srcRi].findIndex(c => c.id === cardId)
        if (ci === -1) return prev
        next[srcRi][ci] = { ...next[srcRi][ci], width: newWidth, slot: newSlot }
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

  /* Done: clean empty rows */
  const handleDone = useCallback(() => {
    setRows(prev => prev.filter(r => r.length > 0))
    setEditing(false)
  }, [])

  /* Get slot index from cursor X relative to a row element */
  const getSlotFromX = useCallback((clientX: number, rowEl: Element, span: number): number => {
    const rect = rowEl.getBoundingClientRect()
    const relX = clientX - rect.left
    const slotWidth = rect.width / GRID_TOTAL
    const raw = Math.max(0, Math.min(GRID_TOTAL - 1, Math.floor(relX / slotWidth)))
    return Math.min(raw, GRID_TOTAL - span)
  }, [])

  /* Find card across all rows */
  const findCard = useCallback((id: string, sourceRows: CardItem[][]) => {
    for (let ri = 0; ri < sourceRows.length; ri++) {
      const ci = sourceRows[ri].findIndex(c => c.id === id)
      if (ci !== -1) return { ri, ci, card: sourceRows[ri][ci] }
    }
    return null
  }, [])

  /* Drag to reorder with slot-based placement */
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
    setDropTarget(null)

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

      const currentRows = rowsRef.current
      const dragCard = currentRows.flatMap(r => r).find(c => c.id === cardId)
      if (!dragCard) return
      const span = WIDTH_SPANS[dragCard.width]

      /* Find which row the cursor is over */
      const rowEls = gridRef.current.querySelectorAll('[data-row-idx]')
      let targetRowIdx: number | null = null
      let targetRowEl: Element | null = null

      for (const el of rowEls) {
        const r = el.getBoundingClientRect()
        if (ev.clientY >= r.top && ev.clientY <= r.bottom) {
          targetRowIdx = parseInt(el.getAttribute('data-row-idx')!)
          targetRowEl = el
          break
        }
      }

      if (targetRowIdx === null || !targetRowEl) {
        setDropTarget(null)
        return
      }

      /* Compute target slot from X position */
      const slot = getSlotFromX(ev.clientX, targetRowEl, span)
      const isNewRow = targetRowIdx >= currentRows.length

      if (isNewRow || canPlace(currentRows[targetRowIdx], slot, span, cardId)) {
        setDropTarget({ rowIdx: targetRowIdx, slot })
      } else {
        setDropTarget(null)
      }
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)

      const target = dropTargetRef.current

      if (activated && target) {
        setRows(prev => {
          const next = prev.map(r => [...r])

          /* Remove card from source row */
          let card: CardItem | null = null
          for (let ri = 0; ri < next.length; ri++) {
            const ci = next[ri].findIndex(c => c.id === cardId)
            if (ci !== -1) {
              card = { ...next[ri][ci] }
              next[ri].splice(ci, 1)
              break
            }
          }
          if (!card) return prev

          /* Place at target slot */
          card.slot = target.slot

          if (target.rowIdx >= next.length) {
            next.push([card])
          } else {
            if (!canPlace(next[target.rowIdx], target.slot, WIDTH_SPANS[card.width])) return prev
            next[target.rowIdx].push(card)
          }

          return next
        })
      }

      setDragId(null)
      setDragActive(false)
      setDropTarget(null)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }, [findCard, getSlotFromX])

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

        {/* Card Grid */}
        <LayoutGroup>
          <motion.div
            ref={gridRef}
            className="space-y-4"
          >
            {rows.map((row, rowIdx) => {
              if (row.length === 0) return null
              const dragCard = dragId ? rows.flatMap(r => r).find(c => c.id === dragId) : null
              const dragSpan = dragCard ? WIDTH_SPANS[dragCard.width] : 0
              const showPlaceholder = dropTarget?.rowIdx === rowIdx && dragActive
              /* Card index offset for staggered entrance */
              const cardOffset = rows.slice(0, rowIdx).reduce((s, r) => s + r.length, 0)

              return (
                <div
                  key={rowIdx}
                  data-row-idx={rowIdx}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${GRID_TOTAL}, 1fr)`,
                    gap: GAP,
                    position: 'relative',
                  }}
                >
                  {row.map((card, cardIdx) => {
                    const span = WIDTH_SPANS[card.width]
                    const isBeingDragged = dragId === card.id && dragActive
                    const entranceDelay = 0.3 + (cardOffset + cardIdx) * 0.1

                    return (
                      <motion.div
                        key={card.id}
                        data-card-id={card.id}
                        layout
                        layoutId={card.id}
                        initial={{ opacity: 0, y: 30, scale: 0.92, filter: 'blur(8px)' }}
                        animate={{ opacity: isBeingDragged ? 0.25 : 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                        transition={{
                          type: 'spring', stiffness: 400, damping: 30, mass: 0.8,
                          opacity: { delay: entranceDelay, duration: 0.5 },
                          y: { delay: entranceDelay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                          scale: { delay: entranceDelay, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                          filter: { delay: entranceDelay, duration: 0.5 },
                        }}
                        className={`rounded-[16px] overflow-hidden relative select-none ${
                          wiggling && !dragId ? 'card-wiggle' : ''
                        }`}
                        style={{
                          ...cardStyle,
                          height: CARD_HEIGHT,
                          gridRow: 1,
                          gridColumn: `${card.slot + 1} / span ${span}`,
                          cursor: editing ? 'grab' : 'default',
                          ...(editing ? {
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.05), 0 0 0 2px rgba(0,0,0,0.04)',
                          } : {}),
                          animationDelay: wiggling ? `${(card.id.charCodeAt(0) % 5) * 30}ms` : '0ms',
                        }}
                        onPointerDown={editing ? (e) => handleDragStart(e, card.id) : undefined}
                        onClick={!editing && card.id === 'projects' ? () => router.push('/demo/projects') : !editing && card.id === 'upload' ? () => router.push('/demo/new-experiment') : undefined}
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

                  {/* Drop placeholder */}
                  {showPlaceholder && (
                    <div
                      style={{
                        gridRow: 1,
                        gridColumn: `${dropTarget.slot + 1} / span ${dragSpan}`,
                        height: CARD_HEIGHT,
                        border: '2px dashed rgba(107,158,107,0.5)',
                        borderRadius: 16,
                        background: 'rgba(107,158,107,0.06)',
                        transition: 'all 0.15s ease',
                      }}
                    />
                  )}
                </div>
              )
            })}

            {/* Invisible new-row drop zone */}
            {editing && (
              <div
                data-row-idx={rows.length}
                style={{ minHeight: 120 }}
              />
            )}
          </motion.div>
        </LayoutGroup>

        {/* Drag ghost */}
        <AnimatePresence>
          {dragId && dragActive && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1.04, rotate: 2 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="fixed pointer-events-none z-[9999] rounded-[16px] overflow-hidden"
              style={{
                left: dragPos.x - dragOffset.x,
                top: dragPos.y - dragOffset.y,
                width: dragSize.w,
                height: dragSize.h,
                ...cardStyle,
                background: 'rgba(255,255,255,0.92)',
                boxShadow: '0 16px 48px rgba(0,0,0,0.18), 0 6px 16px rgba(0,0,0,0.12)',
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
