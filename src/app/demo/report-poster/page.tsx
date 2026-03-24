'use client'

import { useState, useRef, useCallback, useEffect, type MouseEvent as ReactMouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

/* ─── Animation ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const

/* ─── Types ─── */
type BlockId = string

interface BlockOffset {
  dx: number
  dy: number
}

/* ─── Editable Text Component (PowerPoint-like) ─── */
function EditableText({
  value,
  onChange,
  style,
  multiline = false,
  isBlockSelected = false,
}: {
  value: string
  onChange: (v: string) => void
  style?: React.CSSProperties
  multiline?: boolean
  isBlockSelected?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    if (ref.current && !editing && ref.current.textContent !== value) {
      ref.current.textContent = value
    }
  }, [value, editing])

  return (
    <div
      ref={ref}
      contentEditable={isBlockSelected}
      suppressContentEditableWarning
      onFocus={() => setEditing(true)}
      onBlur={(e) => {
        setEditing(false)
        onChange(e.currentTarget.textContent || '')
      }}
      style={{
        ...style,
        outline: 'none',
        borderRadius: 3,
        transition: 'background 0.15s, box-shadow 0.15s',
        background: editing ? 'rgba(76,175,125,0.06)' : 'transparent',
        boxShadow: editing ? 'inset 0 0 0 1.5px rgba(76,175,125,0.25)' : 'none',
        padding: '2px 4px',
        margin: '-2px -4px',
        whiteSpace: multiline ? 'pre-wrap' : undefined,
        cursor: isBlockSelected ? 'text' : 'default',
        pointerEvents: isBlockSelected ? 'auto' : 'none',
      }}
    />
  )
}

/* ─── Bar Chart ─── */
function YieldBarChart() {
  const bars = [
    { label: '37°C', value: 8.3, color: '#cbd5e1' },
    { label: '30°C', value: 22.7, color: '#93c5fd' },
    { label: '25°C', value: 35.4, color: '#60a5fa' },
    { label: '20°C', value: 42.1, color: '#4CAF7D' },
  ]
  const maxVal = 50
  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Fig. 1 — Soluble GFP Yield by Temperature (mg/L)
      </p>
      <svg viewBox="0 0 280 120" style={{ width: '100%', display: 'block' }}>
        {[0, 10, 20, 30, 40, 50].map((v, i) => {
          const y = 98 - (v / maxVal) * 82
          return (
            <g key={i}>
              <line x1="32" y1={y} x2="268" y2={y} stroke="#f1f5f9" strokeWidth="0.5" />
              <text x="28" y={y + 3} textAnchor="end" fill="#94a3b8" fontSize="7" fontFamily="'JetBrains Mono', monospace">{v}</text>
            </g>
          )
        })}
        {bars.map((bar, i) => {
          const barW = 40
          const gap = 16
          const x = 48 + i * (barW + gap)
          const barH = (bar.value / maxVal) * 82
          const y = 98 - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="3" fill={bar.color} />
              <text x={x + barW / 2} y={y - 4} textAnchor="middle" fill="#1e293b" fontSize="7" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
                {bar.value}
              </text>
              <text x={x + barW / 2} y={110} textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="'JetBrains Mono', monospace">{bar.label}</text>
            </g>
          )
        })}
        <line x1="32" y1="98" x2="268" y2="98" stroke="#e2e8f0" strokeWidth="0.6" />
      </svg>
      <p style={{ fontSize: 7, color: '#94a3b8', marginTop: 3, fontStyle: 'italic' }}>Mean ± SEM, n=3 per condition. 16h expression, 0.10 mM IPTG.</p>
    </div>
  )
}

/* ─── Time Course Chart ─── */
function TimeCourseChart() {
  const data20: [number, number][] = [[4, 8.2], [8, 18.5], [12, 30.1], [16, 42.1], [20, 41.8]]
  const data37: [number, number][] = [[4, 5.1], [8, 8.0], [12, 8.5], [16, 8.3], [20, 7.9]]
  const xMax = 24, yMax = 50
  const toX = (v: number) => 32 + (v / xMax) * 236
  const toY = (v: number) => 98 - (v / yMax) * 82

  const path20 = data20.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p[0])},${toY(p[1])}`).join(' ')
  const path37 = data37.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p[0])},${toY(p[1])}`).join(' ')

  return (
    <div>
      <p style={{ fontSize: 9, fontWeight: 700, color: '#475467', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>
        Fig. 2 — GFP Yield Over Expression Time (mg/L)
      </p>
      <svg viewBox="0 0 280 120" style={{ width: '100%', display: 'block' }}>
        {[0, 10, 20, 30, 40, 50].map((v, i) => {
          const y = toY(v)
          return (
            <g key={i}>
              <line x1="32" y1={y} x2="268" y2={y} stroke="#f1f5f9" strokeWidth="0.5" />
              <text x="28" y={y + 2.5} textAnchor="end" fill="#94a3b8" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">{v}</text>
            </g>
          )
        })}
        <path d={path20} fill="none" stroke="#4CAF7D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        {data20.map((p, i) => <circle key={i} cx={toX(p[0])} cy={toY(p[1])} r="2.5" fill="#4CAF7D" />)}
        <path d={path37} fill="none" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="4 2.5" />
        {data37.map((p, i) => <circle key={i} cx={toX(p[0])} cy={toY(p[1])} r="2" fill="#f87171" />)}
        <line x1="32" y1="98" x2="268" y2="98" stroke="#e2e8f0" strokeWidth="0.6" />
        {/* Legend */}
        <line x1="180" y1="10" x2="198" y2="10" stroke="#4CAF7D" strokeWidth="1.8" />
        <text x="202" y="12.5" fill="#64748b" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">20°C</text>
        <line x1="228" y1="10" x2="246" y2="10" stroke="#f87171" strokeWidth="1.4" strokeDasharray="4 2.5" />
        <text x="250" y="12.5" fill="#64748b" fontSize="6.5" fontFamily="'JetBrains Mono', monospace">37°C</text>
      </svg>
      <p style={{ fontSize: 7, color: '#94a3b8', marginTop: 3, fontStyle: 'italic' }}>Data points represent mean of triplicate cultures. IPTG = 0.10 mM.</p>
    </div>
  )
}

/* ─── Poster Content ─── */
const defaultPoster = {
  title: 'Optimization of Recombinant GFP Expression\nYield in E. coli BL21(DE3)',
  authors: 'M. Chen¹, A. Dupont¹, R. Nakamura², S. Petrov¹',
  affiliations: '¹ Dept. of Biochemistry, Sylvy Research Institute  ·  ² Institute of Molecular Biology, ETH Zürich',
  intro: 'Green Fluorescent Protein (GFP) is a widely used reporter in molecular biology. Achieving high soluble yields in E. coli remains challenging due to inclusion body formation at standard temperatures.\n\nThis study systematically evaluates the effects of induction temperature, IPTG concentration, and expression duration on soluble GFP yield across 5 independent experiments using factorial design.',
  methods: 'E. coli BL21(DE3) / pET-28a-GFP were cultured in LB (50 µg/mL Kan) at 37°C to OD₆₀₀ = 0.6. Expression induced with IPTG (0.05–1.0 mM) at 20–37°C for 4–20h.\n\nSoluble fractions isolated by sonication + centrifugation (20,000×g, 30 min, 4°C). GFP quantified by fluorescence (Ex 488 / Em 509 nm) against purified standard (R² > 0.99). All conditions in triplicate.',
  results: 'Induction at 20°C / 0.10 mM IPTG / 16h yielded 42.1 ± 1.8 mg/L soluble GFP — a 5.1× improvement over 37°C (8.3 ± 0.9 mg/L).\n\nSoluble fraction at 20°C: 89% vs 34% at 37°C. High IPTG (1.0 mM) reduced yield ~40% due to metabolic burden.',
  keyInsights: [
    'Temperature is the strongest predictor (p < 0.001)',
    '20°C → 5.1× more soluble GFP than 37°C',
    'Optimal IPTG: 0.10–0.25 mM range',
    '16h at low temp maximizes folding efficiency',
    'High IPTG (≥1.0 mM) triggers metabolic stress',
  ],
  discussion: 'Lower induction temperatures favor proper folding by reducing translation rate, allowing co-translational folding of the GFP chromophore.\n\nTemperature dependence (5.1-fold) exceeds IPTG modulation (1.7-fold), establishing temperature as the primary optimization target.',
  conclusion: 'A simple protocol modification — 20°C induction with 0.10 mM IPTG for 16h — achieves >5-fold improvement in soluble GFP yield.\n\nThis protocol is recommended for routine production and may apply to other aggregation-prone proteins in E. coli.',
  references: [
    'Rosano GL, Ceccarelli EA. Front Microbiol. 2014;5:172.',
    'Schein CH, Noteborn MH. Nat Biotechnol. 1988;6:291–294.',
    'San-Miguel T, et al. Biochem Eng J. 2013;73:18–30.',
    'Tsien RY. Annu Rev Biochem. 1998;67:509–544.',
    'de Marco A, et al. BMC Biotechnol. 2007;7:32.',
  ],
}

/* ─── Poster Block wrapper (selectable, draggable) ─── */
function PosterBlock({
  id,
  children,
  selectedBlock,
  onSelect,
  offset,
  onDragEnd,
  style,
}: {
  id: BlockId
  children: React.ReactNode
  selectedBlock: BlockId | null
  onSelect: (id: BlockId) => void
  offset: BlockOffset
  onDragEnd: (id: BlockId, dx: number, dy: number) => void
  style?: React.CSSProperties
}) {
  const isSelected = selectedBlock === id
  const dragStart = useRef<{ startX: number; startY: number; origDx: number; origDy: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [tempOffset, setTempOffset] = useState<{ dx: number; dy: number } | null>(null)

  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    // Only start drag if this block is already selected
    if (!isSelected) return
    // Don't drag if clicking inside editable content
    const target = e.target as HTMLElement
    if (target.getAttribute('contenteditable') === 'true' || target.closest('[contenteditable="true"]')) return

    e.preventDefault()
    e.stopPropagation()
    dragStart.current = { startX: e.clientX, startY: e.clientY, origDx: offset.dx, origDy: offset.dy }
    setDragging(true)
  }, [isSelected, offset])

  useEffect(() => {
    if (!dragging) return
    const handleMove = (e: globalThis.MouseEvent) => {
      if (!dragStart.current) return
      const dx = dragStart.current.origDx + (e.clientX - dragStart.current.startX)
      const dy = dragStart.current.origDy + (e.clientY - dragStart.current.startY)
      setTempOffset({ dx, dy })
    }
    const handleUp = (e: globalThis.MouseEvent) => {
      if (dragStart.current) {
        const dx = dragStart.current.origDx + (e.clientX - dragStart.current.startX)
        const dy = dragStart.current.origDy + (e.clientY - dragStart.current.startY)
        onDragEnd(id, dx, dy)
      }
      setDragging(false)
      setTempOffset(null)
      dragStart.current = null
    }
    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [dragging, id, onDragEnd])

  const currentOffset = tempOffset ?? offset

  return (
    <div
      onClick={(e) => {
        e.stopPropagation()
        onSelect(id)
      }}
      onMouseDown={handleMouseDown}
      style={{
        ...style,
        position: 'relative',
        transform: `translate(${currentOffset.dx}px, ${currentOffset.dy}px)`,
        transition: dragging ? 'none' : 'transform 0.2s ease, box-shadow 0.2s ease',
        borderRadius: 4,
        cursor: isSelected ? (dragging ? 'grabbing' : 'grab') : 'pointer',
        outline: isSelected ? '2px solid rgba(76,175,125,0.5)' : '2px solid transparent',
        outlineOffset: 3,
        zIndex: isSelected ? 10 : 1,
      }}
    >
      {children}
      {/* Selection handles */}
      {isSelected && !dragging && (
        <>
          {[
            { top: -5, left: -5 },
            { top: -5, right: -5 },
            { bottom: -5, left: -5 },
            { bottom: -5, right: -5 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                ...pos,
                width: 8,
                height: 8,
                borderRadius: 2,
                background: '#4CAF7D',
                border: '1.5px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                zIndex: 20,
              }}
            />
          ))}
        </>
      )}
    </div>
  )
}

/* ─── Zoom Controls ─── */
const ZOOM_PRESETS = [0.5, 0.65, 0.75, 0.85, 1, 1.15, 1.25, 1.5, 1.75, 2]

function ZoomControls({ zoom, onZoomChange }: { zoom: number; onZoomChange: (z: number) => void }) {
  const zoomIn = () => {
    const next = ZOOM_PRESETS.find((z) => z > zoom + 0.01)
    if (next) onZoomChange(next)
  }
  const zoomOut = () => {
    const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoom - 0.01)
    if (prev) onZoomChange(prev)
  }
  const fit = () => onZoomChange(0.65)

  const btnStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(20px)',
    border: '0.5px solid rgba(255,255,255,0.4)',
    boxShadow: '0 0.5px 0 0 rgba(255,255,255,0.5) inset, 0 1px 4px rgba(0,0,0,0.04)',
  }

  return (
    <div className="flex items-center gap-1">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={zoomOut}
        className="flex items-center justify-center w-[28px] h-[28px] rounded-[8px] cursor-pointer text-[#3c3c43]"
        style={btnStyle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={fit}
        className="flex items-center justify-center h-[28px] px-2 rounded-[8px] cursor-pointer text-[11px] font-semibold text-[#3c3c43] tabular-nums"
        style={btnStyle}
      >
        {Math.round(zoom * 100)}%
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={zoomIn}
        className="flex items-center justify-center w-[28px] h-[28px] rounded-[8px] cursor-pointer text-[#3c3c43]"
        style={btnStyle}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </motion.button>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════ */
export default function ReportPosterPage() {
  const router = useRouter()
  const [poster, setPoster] = useState(defaultPoster)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved'>('idle')
  const [exportFeedback, setExportFeedback] = useState<'idle' | 'pdf' | 'ppt'>('idle')
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLDivElement>(null)
  const saveRef = useRef<NodeJS.Timeout | null>(null)
  const [zoom, setZoom] = useState(0.65)
  const [selectedBlock, setSelectedBlock] = useState<BlockId | null>(null)
  const [blockOffsets, setBlockOffsets] = useState<Record<BlockId, BlockOffset>>({})

  const getOffset = (id: BlockId): BlockOffset => blockOffsets[id] ?? { dx: 0, dy: 0 }
  const handleDragEnd = useCallback((id: BlockId, dx: number, dy: number) => {
    setBlockOffsets((prev) => ({ ...prev, [id]: { dx, dy } }))
  }, [])

  const update = useCallback((field: string, value: string | string[]) => {
    setPoster((p) => ({ ...p, [field]: value }))
    setSaveStatus('idle')
    if (saveRef.current) clearTimeout(saveRef.current)
    saveRef.current = setTimeout(() => {
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2000)
    }, 800)
  }, [])

  const handleExport = useCallback((format: 'pdf' | 'ppt') => {
    setExportMenuOpen(false)
    setExportFeedback(format)
    setTimeout(() => setExportFeedback('idle'), 2500)
  }, [])

  /* Close export menu on outside click */
  useEffect(() => {
    if (!exportMenuOpen) return
    const handleClick = (e: globalThis.MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false)
      }
    }
    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [exportMenuOpen])

  const handleRegenerate = useCallback(() => {
    setPoster(defaultPoster)
    setBlockOffsets({})
    setSelectedBlock(null)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus('idle'), 1500)
  }, [])

  /* Deselect on clicking canvas background */
  const handleCanvasClick = useCallback(() => {
    setSelectedBlock(null)
  }, [])

  /* ─── Trackpad pinch-to-zoom on canvas ─── */
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ZOOM_MIN = 0.5
    const ZOOM_MAX = 2.0
    const SENSITIVITY = 0.004 // lower = less sensitive

    const handleWheel = (e: WheelEvent) => {
      // Trackpad pinch gestures fire as wheel events with ctrlKey=true
      if (!e.ctrlKey) return

      e.preventDefault()
      e.stopPropagation()

      // deltaY is positive when pinching in (zoom out), negative when pinching out (zoom in)
      const delta = -e.deltaY * SENSITIVITY
      setZoom((prev) => {
        const next = prev * (1 + delta)
        return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round(next * 1000) / 1000))
      })
    }

    // Must use { passive: false } to allow preventDefault
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  }, [])

  /* Keyboard: zoom with Cmd +/-, Escape to deselect */
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedBlock(null)
      if ((e.metaKey || e.ctrlKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault()
        const next = ZOOM_PRESETS.find((z) => z > zoom + 0.01)
        if (next) setZoom(next)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '-') {
        e.preventDefault()
        const prev = [...ZOOM_PRESETS].reverse().find((z) => z < zoom - 0.01)
        if (prev) setZoom(prev)
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        e.preventDefault()
        setZoom(0.65)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [zoom])

  /* Styles */
  const sectionLabel: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#ffffff',
    background: 'linear-gradient(135deg, #2d7a54 0%, #3d9d6b 100%)',
    padding: '5px 12px',
    borderRadius: 4,
    marginBottom: 10,
    display: 'inline-block',
  }

  const bodyText: React.CSSProperties = {
    fontSize: 9.5,
    lineHeight: 1.65,
    color: '#334155',
    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  }

  /* ─── Poster dimensions: fixed at A4-ish portrait ─── */
  const POSTER_W = 900
  const POSTER_H = Math.round(POSTER_W * 1.414)

  return (
    <div
      className="h-screen w-full flex flex-col relative"
      style={{
        background: 'linear-gradient(145deg, #c8ddb8 0%, #a8c8a0 25%, #b8d4a8 50%, #c0d8b0 75%, #d0e0c0 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ─── Top Bar ─── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="flex-shrink-0 z-40"
        style={{
          background: 'rgba(200, 221, 184, 0.82)',
          backdropFilter: 'blur(30px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.6)',
          borderBottom: '0.5px solid rgba(255,255,255,0.3)',
        }}
      >
        <div className="mx-auto max-w-[1400px] px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.back()}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-[30px] h-[30px] rounded-[10px] cursor-pointer transition-colors hover:bg-black/[0.04]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
            <Image src={logoBlack} alt="Sylvy" width={22} height={22} className="object-contain cursor-pointer" onClick={() => router.push('/demo')} />
            <span className="text-[13px] font-medium text-[#1d1d1f]">Scientific Poster</span>

            <AnimatePresence mode="wait">
              {saveStatus === 'saved' && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-1 ml-1 text-[11px] text-[#4CAF7D]"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Saved
                </motion.span>
              )}
            </AnimatePresence>

            <div className="w-px h-4 bg-black/[0.08] mx-1" />

            {/* Zoom controls */}
            <ZoomControls zoom={zoom} onZoomChange={setZoom} />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#8e8e93] italic mr-2">Click to select · Double-click to edit · Drag to move</span>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleRegenerate}
              className="flex items-center gap-1.5 rounded-[8px] px-3 py-1.5 text-[11px] font-medium text-[#3c3c43] cursor-pointer"
              style={{
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(20px)',
                border: '0.5px solid rgba(255,255,255,0.4)',
                boxShadow: '0 0.5px 0 0 rgba(255,255,255,0.5) inset, 0 1px 4px rgba(0,0,0,0.04)',
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
              Regenerate
            </motion.button>

            <div ref={exportMenuRef} className="relative">
              <motion.button
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => exportFeedback === 'idle' && setExportMenuOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-[8px] px-4 py-1.5 text-[11px] font-semibold text-white cursor-pointer"
                style={{
                  background: exportFeedback !== 'idle' ? '#3d9d6b' : 'linear-gradient(135deg, #4CAF7D 0%, #3d9d6b 100%)',
                  boxShadow: '0 2px 8px rgba(76,175,125,0.3)',
                }}
              >
                {exportFeedback !== 'idle' ? (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Exported as {exportFeedback.toUpperCase()}
                  </>
                ) : (
                  <>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    Export
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </>
                )}
              </motion.button>

              <AnimatePresence>
                {exportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-1.5 z-50 rounded-[10px] overflow-hidden"
                    style={{
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(24px)',
                      border: '0.5px solid rgba(0,0,0,0.08)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.12), 0 0 0 0.5px rgba(0,0,0,0.04)',
                      minWidth: 150,
                    }}
                  >
                    {[
                      { key: 'pdf' as const, label: 'Export as PDF', icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                      )},
                      { key: 'ppt' as const, label: 'Export as PPT', icon: (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                      )},
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => handleExport(item.key)}
                        className="flex items-center gap-2.5 w-full px-3.5 py-2 text-[11px] font-medium text-[#1d1d1f] cursor-pointer transition-colors hover:bg-black/[0.04]"
                      >
                        <span className="text-[#6e6e73]">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Scrollable Canvas Area ─── */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-auto"
        onClick={handleCanvasClick}
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(0,0,0,0.15) transparent',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            minHeight: '100%',
            padding: '40px 60px 80px',
          }}
        >
          {/* Zoom wrapper */}
          <motion.div
            animate={{ scale: zoom }}
            transition={{ duration: 0.3, ease }}
            style={{ transformOrigin: 'top center', flexShrink: 0 }}
          >
            {/* ─── Poster Canvas ─── */}
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="rounded-[6px]"
              style={{
                width: POSTER_W,
                height: POSTER_H,
                background: '#ffffff',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 16px 56px rgba(0,0,0,0.1), 0 40px 100px rgba(0,0,0,0.07)',
                border: '1px solid rgba(0,0,0,0.04)',
                overflow: 'hidden',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ padding: '36px 40px 28px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                {/* ═══ HEADER ═══ */}
                <PosterBlock
                  id="header"
                  selectedBlock={selectedBlock}
                  onSelect={setSelectedBlock}
                  offset={getOffset('header')}
                  onDragEnd={handleDragEnd}
                  style={{ flexShrink: 0, marginBottom: 22 }}
                >
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #1a5c3a 0%, #2d7a54 40%, #35896b 100%)',
                      borderRadius: 8,
                      padding: '22px 30px 18px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{
                      position: 'absolute', inset: 0, opacity: 0.04,
                      backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 30%, white 0.8px, transparent 0.8px)',
                      backgroundSize: '30px 30px, 45px 45px',
                    }} />
                    <div style={{ position: 'relative' }}>
                      <EditableText
                        value={poster.title}
                        onChange={(v) => update('title', v)}
                        multiline
                        isBlockSelected={selectedBlock === 'header'}
                        style={{
                          fontSize: 20,
                          fontWeight: 800,
                          color: '#ffffff',
                          lineHeight: 1.3,
                          letterSpacing: '-0.01em',
                          fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif",
                        }}
                      />
                      <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <EditableText
                          value={poster.authors}
                          onChange={(v) => update('authors', v)}
                          isBlockSelected={selectedBlock === 'header'}
                          style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.02em' }}
                        />
                        <EditableText
                          value={poster.affiliations}
                          onChange={(v) => update('affiliations', v)}
                          isBlockSelected={selectedBlock === 'header'}
                          style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.55)' }}
                        />
                      </div>
                      <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', opacity: 0.1 }}>
                        <Image src={logoBlack} alt="" width={52} height={52} className="object-contain" style={{ filter: 'brightness(10)' }} />
                      </div>
                    </div>
                  </div>
                </PosterBlock>

                {/* ═══ 2-COLUMN BODY ═══ */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, flex: 1, minHeight: 0 }}>

                  {/* ── LEFT COLUMN ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Introduction */}
                    <PosterBlock id="intro" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('intro')} onDragEnd={handleDragEnd}>
                      <div style={sectionLabel}>Introduction</div>
                      <EditableText value={poster.intro} onChange={(v) => update('intro', v)} multiline isBlockSelected={selectedBlock === 'intro'} style={bodyText} />
                    </PosterBlock>

                    {/* Methods */}
                    <PosterBlock id="methods" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('methods')} onDragEnd={handleDragEnd}>
                      <div style={sectionLabel}>Methods</div>
                      <EditableText value={poster.methods} onChange={(v) => update('methods', v)} multiline isBlockSelected={selectedBlock === 'methods'} style={bodyText} />
                    </PosterBlock>

                    {/* Key Insights */}
                    <PosterBlock id="insights" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('insights')} onDragEnd={handleDragEnd}>
                      <div style={sectionLabel}>Key Insights</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                        {poster.keyInsights.map((insight, i) => (
                          <div key={i} style={{
                            display: 'flex', alignItems: 'flex-start', gap: 7,
                            padding: '5px 8px', borderRadius: 4,
                            background: 'rgba(76,175,125,0.04)',
                            border: '0.5px solid rgba(76,175,125,0.1)',
                          }}>
                            <span style={{ fontSize: 9, fontWeight: 700, color: '#4CAF7D', flexShrink: 0, marginTop: 1 }}>{i + 1}.</span>
                            <EditableText
                              value={insight}
                              onChange={(v) => {
                                const arr = [...poster.keyInsights]
                                arr[i] = v
                                update('keyInsights', arr)
                              }}
                              isBlockSelected={selectedBlock === 'insights'}
                              style={{ fontSize: 9, lineHeight: 1.55, color: '#334155' }}
                            />
                          </div>
                        ))}
                      </div>
                    </PosterBlock>

                    {/* Discussion */}
                    <PosterBlock id="discussion" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('discussion')} onDragEnd={handleDragEnd}>
                      <div style={sectionLabel}>Discussion</div>
                      <EditableText value={poster.discussion} onChange={(v) => update('discussion', v)} multiline isBlockSelected={selectedBlock === 'discussion'} style={bodyText} />
                    </PosterBlock>
                  </div>

                  {/* ── RIGHT COLUMN ── */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                    {/* Results */}
                    <PosterBlock id="results" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('results')} onDragEnd={handleDragEnd}>
                      <div style={sectionLabel}>Results</div>
                      <EditableText value={poster.results} onChange={(v) => update('results', v)} multiline isBlockSelected={selectedBlock === 'results'} style={bodyText} />
                    </PosterBlock>

                    {/* Chart 1 */}
                    <PosterBlock id="chart1" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('chart1')} onDragEnd={handleDragEnd}>
                      <YieldBarChart />
                    </PosterBlock>

                    {/* Chart 2 */}
                    <PosterBlock id="chart2" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('chart2')} onDragEnd={handleDragEnd}>
                      <TimeCourseChart />
                    </PosterBlock>

                    {/* Conclusion */}
                    <PosterBlock id="conclusion" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('conclusion')} onDragEnd={handleDragEnd}>
                      <div style={sectionLabel}>Conclusion</div>
                      <EditableText value={poster.conclusion} onChange={(v) => update('conclusion', v)} multiline isBlockSelected={selectedBlock === 'conclusion'} style={bodyText} />
                    </PosterBlock>

                    {/* References */}
                    <PosterBlock id="references" selectedBlock={selectedBlock} onSelect={setSelectedBlock} offset={getOffset('references')} onDragEnd={handleDragEnd} style={{ marginTop: 'auto' }}>
                      <div style={{ ...sectionLabel, background: 'linear-gradient(135deg, #475467 0%, #64748b 100%)' }}>References</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {poster.references.map((ref, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
                            <span style={{ fontSize: 7.5, color: '#94a3b8', flexShrink: 0 }}>[{i + 1}]</span>
                            <EditableText
                              value={ref}
                              onChange={(v) => {
                                const arr = [...poster.references]
                                arr[i] = v
                                update('references', arr)
                              }}
                              isBlockSelected={selectedBlock === 'references'}
                              style={{ fontSize: 7.5, lineHeight: 1.55, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}
                            />
                          </div>
                        ))}
                      </div>
                    </PosterBlock>
                  </div>
                </div>

                {/* ═══ FOOTER ═══ */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 18,
                  paddingTop: 12,
                  borderTop: '1px solid #e2e8f0',
                  flexShrink: 0,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Image src={logoBlack} alt="Sylvy" width={16} height={16} className="object-contain" style={{ opacity: 0.35 }} />
                    <span style={{ fontSize: 7, color: '#94a3b8' }}>Generated with Sylvy Labmind</span>
                  </div>
                  <span style={{ fontSize: 7, color: '#94a3b8' }}>GFP Expression Screening Project · March 2026</span>
                  <span style={{ fontSize: 7, color: '#cbd5e1' }}>contact@sylvy.co</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
