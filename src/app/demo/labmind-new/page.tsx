'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

/* ─── Animation Presets ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const
const springSmooth = { type: 'spring' as const, stiffness: 200, damping: 28 }

const glass = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(40px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
  boxShadow:
    '0 0.5px 0 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.04)',
  border: '0.5px solid rgba(255,255,255,0.5)',
} as const

/* ─── Types ─── */
type Source = {
  id: string
  title: string
  type: 'report' | 'protocol' | 'summary' | 'pdf' | 'url' | 'note'
  origin: string
  projectId?: string
  accent?: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  bullets?: string[]
  sources?: string[]
}

/* ─── Mock Data ─── */
const projects = [
  {
    id: 'crispr',
    name: 'CRISPR-Cas9 Sequence A12',
    accent: '#E88B8B',
    sources: [
      { id: 'c1', title: 'Experiment report 01', type: 'report' as const },
      { id: 'c2', title: 'Protocol draft', type: 'protocol' as const },
      { id: 'c3', title: 'Result summary', type: 'summary' as const },
      { id: 'c4', title: 'Generated report', type: 'report' as const },
      { id: 'c5', title: 'Cas9_efficiency.pdf', type: 'pdf' as const },
    ],
  },
  {
    id: 'protein',
    name: 'Protein Analysis PDB-1AON',
    accent: '#6AADD8',
    sources: [
      { id: 'p1', title: 'Purification log', type: 'report' as const },
      { id: 'p2', title: 'CD spectrum analysis', type: 'summary' as const },
      { id: 'p3', title: 'SEC elution data', type: 'report' as const },
      { id: 'p4', title: 'Protocol v2', type: 'protocol' as const },
    ],
  },
  {
    id: 'cell',
    name: 'HEK 293 Cell Assay',
    accent: '#E8B44C',
    sources: [
      { id: 'h1', title: 'Transfection report', type: 'report' as const },
      { id: 'h2', title: 'HEK293 assay summary', type: 'summary' as const },
      { id: 'h3', title: 'Viability protocol', type: 'protocol' as const },
      { id: 'h4', title: 'Flow cytometry export', type: 'pdf' as const },
    ],
  },
  {
    id: 'gfp',
    name: 'GFP Expression Screening',
    accent: '#4CAF7D',
    sources: [
      { id: 'g1', title: 'Expression screening Exp-01', type: 'report' as const },
      { id: 'g2', title: 'Induction optimization Exp-03', type: 'report' as const },
      { id: 'g3', title: 'Overnight expression Exp-04', type: 'report' as const },
      { id: 'g4', title: 'High-IPTG comparison Exp-05', type: 'report' as const },
      { id: 'g5', title: 'Fluorescence calibration', type: 'summary' as const },
      { id: 'g6', title: 'Expression protocol v3', type: 'protocol' as const },
    ],
  },
]

/* ─── Fake AI responses (simple messages) ─── */
const fakeResponses: { match: RegExp; response: Omit<Message, 'id' | 'role'> }[] = [
  {
    match: /concentrat|transfect|hek\s*293|efficiency/i,
    response: {
      content:
        'Based on the selected reports, Lipofectamine 3000 at 1.5 µg/mL provides the best overall transfection efficiency (78.3 ± 4.2%) while maintaining acceptable viability above 90%.',
      bullets: [
        'Lipofectamine 3000 yielded 78.3% GFP+ cells at 48h (MFI: 12,450 AU)',
        'Cell viability remained >90% across all Lipofectamine conditions',
        'PEI showed dose-dependent cytotoxicity above 2.0 µg/mL',
      ],
      sources: ['Transfection report', 'HEK293 assay summary', 'Viability protocol'],
    },
  },
  {
    match: /crispr|cas9|sequence|guide|editing/i,
    response: {
      content:
        'Guide RNA sequence A12 achieves an on-target editing efficiency of 87.4% at the AAVS1 locus, with minimal detectable off-target activity.',
      bullets: [
        'On-target efficiency: 87.4 ± 3.1% by T7E1 assay',
        'Indel frequency at top off-target site: <0.3%',
        'Optimal delivery: RNP complex at 20 pmol per 200k cells',
      ],
      sources: ['Experiment report 01', 'Result summary', 'Cas9_efficiency.pdf'],
    },
  },
  {
    match: /protein|purif|fold|structur|cd\s*spectr|pdb/i,
    response: {
      content:
        'PDB-1AON shows predominantly α-helical secondary structure (38% α-helix, 18% β-sheet) with a melting temperature of 52.4 ± 0.8°C.',
      bullets: [
        'Final yield: 12.4 mg per liter of culture',
        'Purity >95% by SDS-PAGE (single band at 57.3 kDa)',
        'CD spectrum: characteristic double minima at 208 and 222 nm',
      ],
      sources: ['Purification log', 'CD spectrum analysis', 'SEC elution data'],
    },
  },
]

const defaultResponse: Omit<Message, 'id' | 'role'> = {
  content:
    'Based on the selected sources, the results indicate consistent findings with statistically significant outcomes in the primary endpoints.',
  bullets: [
    'Key findings are reproducible across experimental replicates',
    'Statistical significance achieved (p < 0.05) for primary endpoints',
    'Methodology follows established protocols with appropriate controls',
  ],
  sources: [],
}

/* ─── Source Type Labels ─── */
const typeLabels: Record<string, string> = {
  report: 'Report',
  protocol: 'Protocol',
  summary: 'Summary',
  pdf: 'PDF',
  url: 'URL',
  note: 'Note',
}

/* ─── GFP Analysis — Reasoning Steps ─── */
const reasoningSteps = [
  'Reviewing selected experiments…',
  'Analyzing expression conditions…',
  'Comparing fluorescence and yield…',
  'Cross-checking literature patterns…',
  'Synthesizing insights…',
]

/* ─── GFP Analysis — Experiment Data ─── */
const experiments = [
  { id: 'Exp-01', yield: 18, temp: 37, iptg: 1.0, duration: '4 h', color: '#E88B8B' },
  { id: 'Exp-02', yield: 32, temp: 30, iptg: 0.25, duration: '6 h', color: '#6AADD8' },
  { id: 'Exp-03', yield: 41, temp: 25, iptg: 0.10, duration: '16 h', color: '#4CAF7D' },
  { id: 'Exp-04', yield: 38, temp: 20, iptg: 0.10, duration: '18 h', color: '#7BC8A4' },
  { id: 'Exp-05', yield: 24, temp: 30, iptg: 1.0, duration: '6 h', color: '#E8B44C' },
  { id: 'Exp-06', yield: 35, temp: 25, iptg: 0.50, duration: '16 h', color: '#9B8EC4' },
]

const keyFactors = [
  { rank: 1, name: 'Induction temperature', impact: 95 },
  { rank: 2, name: 'IPTG concentration', impact: 82 },
  { rank: 3, name: 'Post-induction duration', impact: 68 },
  { rank: 4, name: 'Cell density at induction (OD600)', impact: 51 },
  { rank: 5, name: 'Folding efficiency / solubility', impact: 39 },
]

const interpretations = [
  { text: 'High temperature (37°C) reduces soluble GFP yield due to inclusion body formation', negative: true },
  { text: 'Lower temperatures (20–25°C) improve folding kinetics and fluorescence signal', negative: false },
  { text: 'High IPTG (1.0 mM) causes metabolic stress and lowers net efficiency', negative: true },
  { text: 'Moderate IPTG (0.10–0.25 mM) balances expression rate with proper folding', negative: false },
  { text: 'Longer expression time increases yield only when metabolic stress is controlled', negative: false },
]

const literatureInsights = [
  'Lower induction temperatures improve protein folding and solubility in E. coli expression systems',
  'IPTG concentrations below 1 mM often yield better results for soluble recombinant proteins',
  'Overexpression stress at high inducer concentrations reduces both protein quality and final yield',
]

const references = [
  { authors: 'Rosano & Ceccarelli', year: 2014, title: 'Recombinant protein expression in Escherichia coli: advances and challenges' },
  { authors: 'Mühlmann et al.', year: 2017, title: 'Optimizing recombinant protein expression via automated induction profiling in microtiter plates' },
  { authors: 'Sivashanmugam et al.', year: 2009, title: 'Practical protocols for production of very high yields of recombinant proteins using Escherichia coli' },
]

const sylvyRefs = [
  { project: 'GFP', label: 'Expression screening', exp: 'Exp-01' },
  { project: 'GFP', label: 'Induction optimization', exp: 'Exp-03' },
  { project: 'GFP', label: 'Overnight expression', exp: 'Exp-04' },
  { project: 'GFP', label: 'High-IPTG comparison', exp: 'Exp-05' },
]

/* ─────────────────────────────────────── */
/* Bar Chart SVG Component                  */
/* ─────────────────────────────────────── */
function BarChart({ animate }: { animate: boolean }) {
  const maxYield = 50
  const barWidth = 52
  const gap = 20
  const chartH = 180
  const chartW = experiments.length * (barWidth + gap) - gap + 60

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH + 50}`} className="overflow-visible">
      {/* Y-axis labels */}
      {[0, 10, 20, 30, 40, 50].map((v) => {
        const y = chartH - (v / maxYield) * chartH + 10
        return (
          <g key={v}>
            <line x1="30" y1={y} x2={chartW} y2={y} stroke="rgba(0,0,0,0.05)" strokeWidth="0.5" />
            <text x="24" y={y + 3} textAnchor="end" fill="#8e8e93" fontSize="9" fontFamily="'JetBrains Mono', monospace">
              {v}
            </text>
          </g>
        )
      })}
      <text x="6" y={chartH / 2 + 10} textAnchor="middle" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace" transform={`rotate(-90, 6, ${chartH / 2 + 10})`}>
        mg/L
      </text>

      {/* Bars */}
      {experiments.map((exp, i) => {
        const x = 38 + i * (barWidth + gap)
        const barH = (exp.yield / maxYield) * chartH
        const y = chartH - barH + 10
        return (
          <g key={exp.id}>
            <motion.rect
              x={x}
              y={animate ? y : chartH + 10}
              width={barWidth}
              height={animate ? barH : 0}
              rx={4}
              fill={exp.color}
              initial={{ y: chartH + 10, height: 0 }}
              animate={animate ? { y, height: barH } : { y: chartH + 10, height: 0 }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
            />
            {/* Yield label on top */}
            <motion.text
              x={x + barWidth / 2}
              y={y - 6}
              textAnchor="middle"
              fill="#1d1d1f"
              fontSize="10"
              fontWeight="600"
              fontFamily="'JetBrains Mono', monospace"
              initial={{ opacity: 0 }}
              animate={animate ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.3, delay: 0.5 + i * 0.1 }}
            >
              {exp.yield}
            </motion.text>
            {/* X label */}
            <text x={x + barWidth / 2} y={chartH + 28} textAnchor="middle" fill="#8e8e93" fontSize="9" fontFamily="'JetBrains Mono', monospace">
              {exp.id}
            </text>
            {/* Temp label */}
            <text x={x + barWidth / 2} y={chartH + 40} textAnchor="middle" fill="#b0b0b5" fontSize="7.5" fontFamily="'JetBrains Mono', monospace">
              {exp.temp}°C
            </text>
          </g>
        )
      })}
    </svg>
  )
}

/* ─────────────────────────────────────── */
/* Scatter Chart SVG Component              */
/* ─────────────────────────────────────── */
function ScatterChart({ animate }: { animate: boolean }) {
  const chartW = 420
  const chartH = 200
  const padL = 40
  const padR = 20
  const padT = 15
  const padB = 35
  const plotW = chartW - padL - padR
  const plotH = chartH - padT - padB

  // Map temp to x, yield to y
  const tempMin = 15
  const tempMax = 42
  const yieldMin = 0
  const yieldMax = 50

  const points = experiments.map((exp) => ({
    ...exp,
    cx: padL + ((exp.temp - tempMin) / (tempMax - tempMin)) * plotW,
    cy: padT + plotH - ((exp.yield - yieldMin) / (yieldMax - yieldMin)) * plotH,
  }))

  // Trend line (simple: from high temp/low yield to low temp/high yield)
  const trendStart = { x: padL + ((37 - tempMin) / (tempMax - tempMin)) * plotW, y: padT + plotH - ((18 - yieldMin) / (yieldMax - yieldMin)) * plotH }
  const trendEnd = { x: padL + ((20 - tempMin) / (tempMax - tempMin)) * plotW, y: padT + plotH - ((40 - yieldMin) / (yieldMax - yieldMin)) * plotH }

  // Optimal zone (25–30°C)
  const zoneX1 = padL + ((25 - tempMin) / (tempMax - tempMin)) * plotW
  const zoneX2 = padL + ((30 - tempMin) / (tempMax - tempMin)) * plotW

  return (
    <svg width="100%" viewBox={`0 0 ${chartW} ${chartH}`} className="overflow-visible">
      {/* Optimal zone highlight */}
      <motion.rect
        x={zoneX1}
        y={padT}
        width={zoneX2 - zoneX1}
        height={plotH}
        fill="#4CAF7D"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 0.06 } : { opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        rx={4}
      />
      <motion.text
        x={(zoneX1 + zoneX2) / 2}
        y={padT + 12}
        textAnchor="middle"
        fill="#4CAF7D"
        fontSize="8"
        fontWeight="600"
        fontFamily="'JetBrains Mono', monospace"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 0.7 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        OPTIMAL ZONE
      </motion.text>

      {/* Grid lines */}
      {[0, 10, 20, 30, 40, 50].map((v) => {
        const y = padT + plotH - ((v - yieldMin) / (yieldMax - yieldMin)) * plotH
        return (
          <g key={v}>
            <line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke="rgba(0,0,0,0.04)" strokeWidth="0.5" />
            <text x={padL - 6} y={y + 3} textAnchor="end" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace">
              {v}
            </text>
          </g>
        )
      })}

      {/* X-axis labels */}
      {[20, 25, 30, 35, 40].map((t) => {
        const x = padL + ((t - tempMin) / (tempMax - tempMin)) * plotW
        return (
          <text key={t} x={x} y={chartH - 5} textAnchor="middle" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace">
            {t}°C
          </text>
        )
      })}

      {/* Axis labels */}
      <text x={chartW / 2} y={chartH} textAnchor="middle" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace">
        Induction Temperature
      </text>
      <text x={8} y={chartH / 2} textAnchor="middle" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace" transform={`rotate(-90, 8, ${chartH / 2})`}>
        Yield (mg/L)
      </text>

      {/* Trend line */}
      <motion.line
        x1={trendStart.x}
        y1={trendStart.y}
        x2={trendEnd.x}
        y2={trendEnd.y}
        stroke="#4CAF7D"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={animate ? { pathLength: 1, opacity: 0.5 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      />

      {/* Data points */}
      {points.map((pt, i) => (
        <g key={pt.id}>
          <motion.circle
            cx={pt.cx}
            cy={pt.cy}
            r={6}
            fill={pt.color}
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0, opacity: 0 }}
            animate={animate ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + i * 0.08, ...springSmooth }}
          />
          <motion.text
            x={pt.cx}
            y={pt.cy - 10}
            textAnchor="middle"
            fill="#1d1d1f"
            fontSize="8"
            fontWeight="600"
            fontFamily="'JetBrains Mono', monospace"
            initial={{ opacity: 0 }}
            animate={animate ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3, delay: 0.6 + i * 0.08 }}
          >
            {pt.id}
          </motion.text>
        </g>
      ))}
    </svg>
  )
}

/* ─────────────────────────────────────── */
/* Animated Section Wrapper                 */
/* ─────────────────────────────────────── */
function RevealSection({ children, delay, visible }: { children: React.ReactNode; delay: number; visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.6, delay, ease }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─────────────────────────────────────── */
/* Card wrapper                             */
/* ─────────────────────────────────────── */
function AnalysisCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-[16px] p-5 ${className}`}
      style={{
        background: 'rgba(255, 255, 255, 0.65)',
        border: '0.5px solid rgba(0,0,0,0.05)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
      }}
    >
      {children}
    </div>
  )
}

/* ═════════════════════════════════════════ */
/* MAIN COMPONENT                            */
/* ═════════════════════════════════════════ */
export default function LabmindPage() {
  const router = useRouter()

  /* ── Source panel state ── */
  const [sourceTab, setSourceTab] = useState<'internal' | 'external'>('internal')
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false)
  const [selectedSources, setSelectedSources] = useState<Source[]>([])

  /* ── Discussion state ── */
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  /* ── GFP Analysis state ── */
  const [isGfpAnalysis, setIsGfpAnalysis] = useState(false)
  const [reasoningStep, setReasoningStep] = useState(-1)
  const [reasoningDone, setReasoningDone] = useState(false)
  const [revealStage, setRevealStage] = useState(0)

  /* ── Generate Report state ── */
  const [reportLoading, setReportLoading] = useState(false)
  const [reportStep, setReportStep] = useState(0)
  const reportSteps = [
    'Generating report…',
    'Structuring scientific content…',
    'Designing layout…',
  ]

  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const currentProject = projects.find((p) => p.id === selectedProject)

  /* ── Scroll to bottom on new message ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, reasoningStep, revealStage, reportStep])

  /* ── Generate Report loading sequence ── */
  const handleGenerateReport = useCallback(() => {
    setReportLoading(true)
    setReportStep(0)
  }, [])

  useEffect(() => {
    if (!reportLoading) return
    if (reportStep < reportSteps.length - 1) {
      const t = setTimeout(() => setReportStep((s) => s + 1), 900)
      return () => clearTimeout(t)
    } else {
      const t = setTimeout(() => {
        router.push('/demo/report-poster')
      }, 1000)
      return () => clearTimeout(t)
    }
  }, [reportLoading, reportStep, router, reportSteps.length])

  /* ── Reasoning animation sequence ── */
  const startReasoningAnimation = useCallback(() => {
    let step = 0
    setReasoningStep(0)

    const interval = setInterval(() => {
      step++
      if (step < reasoningSteps.length) {
        setReasoningStep(step)
      } else {
        clearInterval(interval)
        setTimeout(() => {
          setReasoningDone(true)
          setIsLoading(false)
          // Progressive reveal
          let stage = 1
          const revealInterval = setInterval(() => {
            setRevealStage(stage)
            stage++
            if (stage > 9) clearInterval(revealInterval)
          }, 400)
        }, 600)
      }
    }, 500)
  }, [])

  /* ── Toggle source selection ── */
  function toggleSource(projectSource: (typeof projects)[0]['sources'][0]) {
    if (!currentProject) return
    const fullId = `${currentProject.id}-${projectSource.id}`
    const exists = selectedSources.find((s) => s.id === fullId)

    if (exists) {
      setSelectedSources((prev) => prev.filter((s) => s.id !== fullId))
    } else {
      setSelectedSources((prev) => [
        ...prev,
        {
          id: fullId,
          title: projectSource.title,
          type: projectSource.type,
          origin: currentProject.name,
          projectId: currentProject.id,
          accent: currentProject.accent,
        },
      ])
    }
  }

  function addExternalSource(title: string, type: Source['type']) {
    const id = `ext-${Date.now()}`
    setSelectedSources((prev) => [
      ...prev,
      { id, title, type, origin: 'External' },
    ])
  }

  function removeSource(id: string) {
    setSelectedSources((prev) => prev.filter((s) => s.id !== id))
  }

  /* ── Submit question ── */
  function handleSubmit() {
    const q = inputValue.trim()
    if (!q || isLoading) return

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: q }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    // Check if this is the GFP question
    const isGfpQuestion = /rendement|yield|gfp|production|paramètre|influenc/i.test(q)

    if (isGfpQuestion) {
      setIsGfpAnalysis(true)
      setReasoningStep(-1)
      setReasoningDone(false)
      setRevealStage(0)
      setTimeout(() => startReasoningAnimation(), 400)
    } else {
      setTimeout(() => {
        const matched = fakeResponses.find((r) => r.match.test(q))
        const resp = matched?.response || defaultResponse
        const sourceTitles =
          resp.sources && resp.sources.length > 0
            ? resp.sources
            : selectedSources.slice(0, 3).map((s) => s.title)

        const aiMsg: Message = {
          id: `a-${Date.now()}`,
          role: 'assistant',
          content: resp.content,
          bullets: resp.bullets,
          sources: sourceTitles,
        }
        setMessages((prev) => [...prev, aiMsg])
        setIsLoading(false)
      }, 1800)
    }
  }

  const sourceCount = selectedSources.length
  const hasMessages = messages.length > 0

  return (
    <div
      className="min-h-screen w-full relative"
      style={{
        background:
          'linear-gradient(145deg, #c8ddb8 0%, #a8c8a0 25%, #b8d4a8 50%, #c0d8b0 75%, #d0e0c0 100%)',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* ─── Page Header ─── */}
      <div className="mx-auto max-w-[1400px] px-6 pt-10 md:pt-14 pb-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.05, ease }}
          className="flex items-center gap-3 px-1"
        >
          <motion.button
            onClick={() => router.push('/demo/labmind')}
            whileHover={{ scale: 1.05, x: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-black/[0.04]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#1d1d1f"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </motion.button>
          <Image
            src={logoBlack}
            alt="Sylvy"
            width={32}
            height={32}
            className="object-contain flex-shrink-0 cursor-pointer"
            onClick={() => router.push('/demo')}
          />
          <h1 className="text-[22px] font-semibold tracking-[0.08em] text-[#1d1d1f] uppercase">
            Labmind
          </h1>
        </motion.div>
      </div>

      {/* ─── Main Two-Panel Layout ─── */}
      <div className="mx-auto max-w-[1400px] px-6 py-6 md:py-8">
        <div className="flex gap-5 items-start" style={{ minHeight: 'calc(100vh - 120px)' }}>
          {/* ════════════════════════════════════════ */}
          {/* LEFT PANEL — Sources                     */}
          {/* ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="w-[380px] flex-shrink-0 rounded-[22px] flex flex-col"
            style={{ ...glass, background: 'rgba(255, 255, 255, 0.78)' }}
          >
            {/* Panel Header */}
            <div className="px-6 pt-5 pb-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">
                  Sources
                </h2>
                <span className="text-[10px] font-medium text-[#b0b0b5]">
                  {sourceCount} selected
                </span>
              </div>

              {/* Tab Switcher */}
              <div
                className="flex rounded-[10px] p-[3px]"
                style={{ background: 'rgba(0,0,0,0.04)' }}
              >
                {(['internal', 'external'] as const).map((tab) => (
                  <motion.button
                    key={tab}
                    onClick={() => setSourceTab(tab)}
                    className="flex-1 py-2 text-[11px] font-semibold tracking-[0.02em] rounded-[8px] cursor-pointer transition-colors"
                    style={{
                      background: sourceTab === tab ? 'rgba(255,255,255,0.9)' : 'transparent',
                      color: sourceTab === tab ? '#1d1d1f' : '#8e8e93',
                      boxShadow:
                        sourceTab === tab
                          ? '0 1px 4px rgba(0,0,0,0.06), 0 0.5px 0 rgba(255,255,255,0.8) inset'
                          : 'none',
                    }}
                  >
                    {tab === 'internal' ? 'From Sylvy projects' : 'External sources'}
                  </motion.button>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }} />

            {/* Tab Content */}
            <div className="px-6 py-4 flex-1 overflow-y-auto" style={{ maxHeight: 320 }}>
              <AnimatePresence mode="wait">
                {sourceTab === 'internal' ? (
                  <motion.div
                    key="internal"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease }}
                  >
                    {/* Project Dropdown */}
                    <div className="relative mb-3">
                      <motion.button
                        onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-[12px] px-4 py-3 text-[13px] cursor-pointer transition-colors"
                        style={{
                          background: projectDropdownOpen
                            ? 'rgba(0,0,0,0.04)'
                            : 'rgba(0,0,0,0.02)',
                          border: '0.5px solid rgba(0,0,0,0.06)',
                        }}
                      >
                        <span
                          className="font-medium"
                          style={{ color: currentProject ? '#1d1d1f' : '#8e8e93' }}
                        >
                          {currentProject ? currentProject.name : 'Select a project…'}
                        </span>
                        <motion.svg
                          animate={{ rotate: projectDropdownOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#b0b0b5"
                          strokeWidth="2"
                          strokeLinecap="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </motion.svg>
                      </motion.button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {projectDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -4, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -4, scale: 0.98 }}
                            transition={{ duration: 0.2, ease }}
                            className="absolute top-full left-0 right-0 mt-1 z-50 rounded-[14px] overflow-hidden"
                            style={{
                              background: 'rgba(255,255,255,0.95)',
                              boxShadow:
                                '0 4px 20px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06)',
                              border: '0.5px solid rgba(0,0,0,0.06)',
                              backdropFilter: 'blur(20px)',
                            }}
                          >
                            {projects.map((project, i) => (
                              <motion.button
                                key={project.id}
                                onClick={() => {
                                  setSelectedProject(project.id)
                                  setProjectDropdownOpen(false)
                                }}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)' }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left cursor-pointer transition-colors"
                                style={{
                                  borderBottom:
                                    i < projects.length - 1
                                      ? '0.5px solid rgba(0,0,0,0.06)'
                                      : 'none',
                                  background:
                                    selectedProject === project.id
                                      ? 'rgba(76,175,125,0.06)'
                                      : 'transparent',
                                }}
                              >
                                <div
                                  className="w-[8px] h-[8px] rounded-full flex-shrink-0"
                                  style={{ background: project.accent }}
                                />
                                <span
                                  className="text-[13px]"
                                  style={{
                                    color: '#1d1d1f',
                                    fontWeight:
                                      selectedProject === project.id ? 500 : 400,
                                  }}
                                >
                                  {project.name}
                                </span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Source Checklist */}
                    {currentProject ? (
                      <div className="space-y-1.5">
                        {/* Select All */}
                        {(() => {
                          const allIds = currentProject.sources.map((s) => `${currentProject.id}-${s.id}`)
                          const allSelected = allIds.every((id) => selectedSources.some((s) => s.id === id))
                          return (
                            <motion.button
                              onClick={() => {
                                if (allSelected) {
                                  setSelectedSources((prev) => prev.filter((s) => !allIds.includes(s.id)))
                                } else {
                                  const toAdd = currentProject.sources
                                    .filter((src) => !selectedSources.some((s) => s.id === `${currentProject.id}-${src.id}`))
                                    .map((src) => ({
                                      id: `${currentProject.id}-${src.id}`,
                                      title: src.title,
                                      type: src.type,
                                      origin: currentProject.name,
                                      projectId: currentProject.id,
                                      accent: currentProject.accent,
                                    }))
                                  setSelectedSources((prev) => [...prev, ...toAdd])
                                }
                              }}
                              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                              className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2 text-left cursor-pointer transition-all mb-1"
                            >
                              <div
                                className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                  background: allSelected ? currentProject.accent : 'rgba(0,0,0,0.06)',
                                  border: allSelected ? 'none' : '1px solid rgba(0,0,0,0.1)',
                                }}
                              >
                                {allSelected && (
                                  <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.15, ease }} width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12" />
                                  </motion.svg>
                                )}
                              </div>
                              <span className="text-[12px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em]">
                                {allSelected ? 'Deselect all' : 'Select all'}
                              </span>
                            </motion.button>
                          )
                        })()}
                        {currentProject.sources.map((src) => {
                          const fullId = `${currentProject.id}-${src.id}`
                          const isSelected = selectedSources.some((s) => s.id === fullId)
                          return (
                            <motion.button
                              key={src.id}
                              onClick={() => toggleSource(src)}
                              whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                              className="w-full flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left cursor-pointer transition-all"
                              style={{
                                background: isSelected
                                  ? `${currentProject.accent}08`
                                  : 'transparent',
                              }}
                            >
                              <div
                                className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center flex-shrink-0 transition-all"
                                style={{
                                  background: isSelected
                                    ? currentProject.accent
                                    : 'rgba(0,0,0,0.06)',
                                  border: isSelected
                                    ? 'none'
                                    : '1px solid rgba(0,0,0,0.1)',
                                }}
                              >
                                {isSelected && (
                                  <motion.svg
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ duration: 0.15, ease }}
                                    width="11"
                                    height="11"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <polyline points="20 6 9 17 4 12" />
                                  </motion.svg>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-[13px] text-[#1d1d1f] truncate"
                                  style={{
                                    fontWeight: isSelected ? 500 : 400,
                                  }}
                                >
                                  {src.title}
                                </p>
                              </div>
                              <span
                                className="text-[9px] font-semibold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                style={{
                                  background: 'rgba(0,0,0,0.04)',
                                  color: '#8e8e93',
                                }}
                              >
                                {typeLabels[src.type]}
                              </span>
                            </motion.button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <svg
                          className="mx-auto mb-3 opacity-30"
                          width="28"
                          height="28"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#8e8e93"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                        </svg>
                        <p className="text-[12px] text-[#b0b0b5]">
                          Select a project to browse sources
                        </p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="external"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25, ease }}
                    className="space-y-2"
                  >
                    {[
                      {
                        label: 'Upload PDF',
                        type: 'pdf' as const,
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        ),
                        fake: 'Supplementary_data.pdf',
                      },
                      {
                        label: 'Paste URL',
                        type: 'url' as const,
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                        ),
                        fake: 'Nature article — doi:10.1038/s41586',
                      },
                      {
                        label: 'Add text note',
                        type: 'note' as const,
                        icon: (
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        ),
                        fake: 'Observation notes — Run #7',
                      },
                    ].map((opt) => (
                      <motion.button
                        key={opt.label}
                        onClick={() => addExternalSource(opt.fake, opt.type)}
                        whileHover={{ backgroundColor: 'rgba(0,0,0,0.03)', y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full flex items-center gap-3 rounded-[12px] px-4 py-3.5 text-left cursor-pointer transition-colors"
                        style={{
                          background: 'rgba(0,0,0,0.015)',
                          border: '0.5px solid rgba(0,0,0,0.06)',
                          color: '#6b6b6b',
                        }}
                      >
                        {opt.icon}
                        <span className="text-[13px] font-medium text-[#1d1d1f]">
                          {opt.label}
                        </span>
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Selected Sources List */}
            <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }} />
            <div className="px-6 py-4">
              <h3 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3">
                Selected sources
              </h3>
              {selectedSources.length === 0 ? (
                <div className="py-5 text-center">
                  <svg
                    className="mx-auto mb-2.5 opacity-25"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#8e8e93"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <path d="M12 12h.01" />
                  </svg>
                  <p className="text-[11px] text-[#b0b0b5] leading-relaxed max-w-[220px] mx-auto">
                    Your selected sources will appear here.
                    <br />
                    Choose from Sylvy projects or add external documents.
                  </p>
                </div>
              ) : (
                <div
                  className="space-y-1.5 overflow-y-auto"
                  style={{ maxHeight: 200 }}
                >
                  <AnimatePresence>
                    {selectedSources.map((source) => (
                      <motion.div
                        key={source.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2, ease }}
                        className="overflow-hidden"
                      >
                        <div
                          className="flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 group"
                          style={{ background: 'rgba(0,0,0,0.02)' }}
                        >
                          {source.accent && (
                            <div
                              className="w-[6px] h-[6px] rounded-full flex-shrink-0"
                              style={{ background: source.accent }}
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p
                              className="text-[12px] font-medium text-[#1d1d1f] truncate"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {source.title}
                            </p>
                            <p className="text-[10px] text-[#b0b0b5] truncate">
                              {source.origin}
                            </p>
                          </div>
                          <span
                            className="text-[9px] font-semibold uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-full flex-shrink-0"
                            style={{
                              background: source.accent
                                ? `${source.accent}15`
                                : 'rgba(0,0,0,0.06)',
                              color: source.accent || '#8e8e93',
                            }}
                          >
                            {typeLabels[source.type]}
                          </span>
                          <motion.button
                            onClick={() => removeSource(source.id)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex-shrink-0"
                          >
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="#b0b0b5"
                              strokeWidth="2"
                              strokeLinecap="round"
                            >
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </motion.button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </motion.div>

          {/* ════════════════════════════════════════ */}
          {/* RIGHT PANEL — Discussion                 */}
          {/* ════════════════════════════════════════ */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="flex-1 rounded-[22px] flex flex-col"
            style={{
              ...glass,
              background: 'rgba(255, 255, 255, 0.78)',
              minHeight: 'calc(100vh - 160px)',
              maxHeight: 'calc(200vh - 320px)',
            }}
          >
            {/* Panel Header */}
            <div className="px-7 pt-5 pb-4 flex-shrink-0">
              <h2 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">
                Discussion
              </h2>
            </div>

            <div className="flex-shrink-0" style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }} />

            {/* Chat Area */}
            <div className="flex-1 px-7 py-5 overflow-y-auto min-h-0">
              {!hasMessages ? (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center py-16">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease }}
                    className="text-center"
                  >
                    <div className="mx-auto mb-5 w-[52px] h-[52px] rounded-[14px] flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.08)' }}>
                      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7-.5.8-.8 1.7-.8 2.6C6 19.5 7.8 21 10 21.5" stroke="#4CAF7D" />
                        <path d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7.5.8.8 1.7.8 2.6 0 2-1.8 3.5-4 4" stroke="#4CAF7D" />
                        <path d="M12 2v20" stroke="#4CAF7D" opacity="0.4" />
                        <path d="M8 8h8" stroke="#4CAF7D" opacity="0.4" />
                        <path d="M9 14h6" stroke="#4CAF7D" opacity="0.4" />
                      </svg>
                    </div>

                    <h3 className="text-[20px] font-semibold text-[#1d1d1f] tracking-[-0.01em] mb-2">
                      Sylvy Labmind
                    </h3>
                    <p className="text-[13px] text-[#8e8e93] max-w-[300px] leading-relaxed">
                      {sourceCount > 0
                        ? 'Ask a question about your selected sources'
                        : 'Select sources to start reasoning across your scientific data'}
                    </p>

                    {sourceCount > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="mt-4 flex items-center justify-center gap-1.5"
                      >
                        <div className="w-[6px] h-[6px] rounded-full bg-[#4CAF7D]" />
                        <span className="text-[11px] font-medium text-[#4CAF7D]">
                          {sourceCount} source{sourceCount > 1 ? 's' : ''} ready
                        </span>
                      </motion.div>
                    )}
                  </motion.div>
                </div>
              ) : (
                /* Messages */
                <div className="space-y-5">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease }}
                    >
                      {msg.role === 'user' ? (
                        <div className="flex justify-end">
                          <div
                            className="max-w-[85%] rounded-[14px] px-5 py-3.5"
                            style={{
                              background: 'rgba(0,0,0,0.04)',
                              border: '0.5px solid rgba(0,0,0,0.06)',
                            }}
                          >
                            <p className="text-[14px] text-[#1d1d1f] leading-relaxed">
                              {msg.content}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Simple assistant message */
                        <div className="max-w-[92%]">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.1)' }}>
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7" />
                                <path d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7" />
                              </svg>
                            </div>
                            <span className="text-[11px] font-semibold text-[#4CAF7D] uppercase tracking-[0.04em]">
                              Labmind
                            </span>
                          </div>

                          <p className="text-[12.5px] text-[#2c2c2e] leading-[1.7] mb-3" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {msg.content}
                          </p>

                          {msg.bullets && msg.bullets.length > 0 && (
                            <div className="rounded-[10px] px-4 py-3 mb-3 space-y-1.5" style={{ background: 'rgba(0,0,0,0.02)', border: '0.5px solid rgba(0,0,0,0.04)' }}>
                              {msg.bullets.map((b, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <div className="w-[4px] h-[4px] rounded-full bg-[#4CAF7D] mt-[7px] flex-shrink-0" style={{ opacity: 0.6 }} />
                                  <p className="text-[12px] text-[#3c3c43] leading-[1.6]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                    {b}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((s, i) => (
                                <span key={i} className="text-[10px] font-semibold uppercase tracking-[0.04em] px-2.5 py-1 rounded-full" style={{ background: 'rgba(76,175,125,0.08)', color: '#4CAF7D' }}>
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* ─── GFP Analysis: Reasoning Animation ─── */}
                  <AnimatePresence>
                    {isGfpAnalysis && !reasoningDone && reasoningStep >= 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.4, ease }}
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.1)' }}>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                              className="w-[10px] h-[10px] border-[1.5px] border-[#4CAF7D]/30 border-t-[#4CAF7D] rounded-full"
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#4CAF7D] uppercase tracking-[0.04em]">
                            Labmind is thinking
                          </span>
                        </div>

                        <div
                          className="rounded-[14px] px-5 py-4 space-y-2"
                          style={{
                            background: 'linear-gradient(135deg, rgba(76,175,125,0.04) 0%, rgba(76,175,125,0.02) 100%)',
                            border: '0.5px solid rgba(76,175,125,0.12)',
                          }}
                        >
                          {reasoningSteps.map((step, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{
                                opacity: i <= reasoningStep ? 1 : 0,
                                x: i <= reasoningStep ? 0 : -8,
                              }}
                              transition={{ duration: 0.3, ease }}
                              className="flex items-center gap-2.5"
                            >
                              {i < reasoningStep ? (
                                <motion.svg
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ duration: 0.2, ...springSmooth }}
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#4CAF7D"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </motion.svg>
                              ) : i === reasoningStep ? (
                                <motion.div
                                  animate={{ opacity: [0.4, 1, 0.4] }}
                                  transition={{ duration: 1.2, repeat: Infinity }}
                                  className="w-[14px] h-[14px] flex items-center justify-center"
                                >
                                  <div className="w-[6px] h-[6px] rounded-full bg-[#4CAF7D]" />
                                </motion.div>
                              ) : (
                                <div className="w-[14px] h-[14px]" />
                              )}
                              <span
                                className="text-[12px]"
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  color: i <= reasoningStep ? '#2c2c2e' : '#b0b0b5',
                                  fontWeight: i === reasoningStep ? 500 : 400,
                                }}
                              >
                                {step}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* ─── GFP Analysis: Rich Structured Answer ─── */}
                  {isGfpAnalysis && reasoningDone && (
                    <div className="space-y-5">
                      {/* Title */}
                      <RevealSection delay={0} visible={revealStage >= 1}>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.1)' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7" />
                              <path d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7" />
                            </svg>
                          </div>
                          <span className="text-[11px] font-semibold text-[#4CAF7D] uppercase tracking-[0.04em]">
                            Labmind Analysis
                          </span>
                        </div>
                        <h3 className="text-[17px] font-semibold text-[#1d1d1f] tracking-[-0.01em] leading-snug">
                          Analysis of the main drivers of GFP production yield
                        </h3>
                      </RevealSection>

                      {/* Short Answer */}
                      <RevealSection delay={0.1} visible={revealStage >= 1}>
                        <p
                          className="text-[12.5px] text-[#2c2c2e] leading-[1.75]"
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          Across the experiments analyzed, GFP yield is primarily driven by <strong>induction temperature</strong>, <strong>IPTG concentration</strong>, and <strong>expression duration</strong>. Lower temperatures combined with moderate induction strength consistently produce higher soluble yields and stronger fluorescence signals. This aligns with established recombinant protein expression principles.
                        </p>
                      </RevealSection>

                      {/* Key Factors */}
                      <RevealSection delay={0} visible={revealStage >= 2}>
                        <AnalysisCard>
                          <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                            Key Factors — Ranked by Impact
                          </h4>
                          <div className="space-y-3">
                            {keyFactors.map((f, i) => (
                              <motion.div
                                key={f.rank}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="flex items-center gap-3"
                              >
                                <span
                                  className="text-[10px] font-bold w-[20px] h-[20px] rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{
                                    background: i === 0 ? '#4CAF7D' : i === 1 ? 'rgba(76,175,125,0.6)' : 'rgba(76,175,125,0.2)',
                                    color: i <= 1 ? 'white' : '#4CAF7D',
                                  }}
                                >
                                  {f.rank}
                                </span>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[12px] font-medium text-[#1d1d1f]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                      {f.name}
                                    </span>
                                    <span className="text-[10px] font-semibold text-[#8e8e93]">{f.impact}%</span>
                                  </div>
                                  <div className="w-full h-[4px] rounded-full" style={{ background: 'rgba(0,0,0,0.04)' }}>
                                    <motion.div
                                      className="h-full rounded-full"
                                      style={{ background: `rgba(76,175,125,${0.3 + (f.impact / 100) * 0.7})` }}
                                      initial={{ width: 0 }}
                                      animate={{ width: `${f.impact}%` }}
                                      transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: [0.34, 1.56, 0.64, 1] }}
                                    />
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </AnalysisCard>
                      </RevealSection>

                      {/* Experiment Data Table */}
                      <RevealSection delay={0} visible={revealStage >= 3}>
                        <AnalysisCard>
                          <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                            Experiment Data
                          </h4>
                          <div className="overflow-hidden rounded-[10px]" style={{ border: '0.5px solid rgba(0,0,0,0.06)' }}>
                            <table className="w-full" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              <thead>
                                <tr style={{ background: 'rgba(0,0,0,0.025)' }}>
                                  <th className="text-left text-[10px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em] px-4 py-2.5">Experiment</th>
                                  <th className="text-right text-[10px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em] px-4 py-2.5">Yield</th>
                                  <th className="text-right text-[10px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em] px-4 py-2.5">Temp</th>
                                  <th className="text-right text-[10px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em] px-4 py-2.5">IPTG</th>
                                  <th className="text-right text-[10px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em] px-4 py-2.5">Duration</th>
                                </tr>
                              </thead>
                              <tbody>
                                {experiments.map((exp, i) => (
                                  <motion.tr
                                    key={exp.id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3, delay: i * 0.06 }}
                                    style={{
                                      borderTop: '0.5px solid rgba(0,0,0,0.04)',
                                      background: exp.id === 'Exp-03' ? 'rgba(76,175,125,0.04)' : 'transparent',
                                    }}
                                  >
                                    <td className="px-4 py-2.5 text-[12px] font-medium text-[#1d1d1f]">
                                      <div className="flex items-center gap-2">
                                        <div className="w-[6px] h-[6px] rounded-full" style={{ background: exp.color }} />
                                        {exp.id}
                                      </div>
                                    </td>
                                    <td className="text-right px-4 py-2.5 text-[12px] font-semibold" style={{ color: exp.yield >= 35 ? '#4CAF7D' : exp.yield <= 20 ? '#E88B8B' : '#1d1d1f' }}>
                                      {exp.yield} mg/L
                                    </td>
                                    <td className="text-right px-4 py-2.5 text-[12px] text-[#2c2c2e]">{exp.temp}°C</td>
                                    <td className="text-right px-4 py-2.5 text-[12px] text-[#2c2c2e]">{exp.iptg} mM</td>
                                    <td className="text-right px-4 py-2.5 text-[12px] text-[#2c2c2e]">{exp.duration}</td>
                                  </motion.tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </AnalysisCard>
                      </RevealSection>

                      {/* Charts */}
                      <RevealSection delay={0} visible={revealStage >= 4}>
                        <div className="grid grid-cols-2 gap-4">
                          <AnalysisCard>
                            <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3">
                              GFP yield across conditions
                            </h4>
                            <BarChart animate={revealStage >= 4} />
                          </AnalysisCard>

                          <AnalysisCard>
                            <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3">
                              Yield vs induction temperature
                            </h4>
                            <ScatterChart animate={revealStage >= 4} />
                            <p className="text-[10px] text-[#8e8e93] mt-2 italic" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                              Fluorescence intensity strongly correlates with soluble yield (r² = 0.91)
                            </p>
                          </AnalysisCard>
                        </div>
                      </RevealSection>

                      {/* Interpretation */}
                      <RevealSection delay={0} visible={revealStage >= 5}>
                        <AnalysisCard>
                          <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                            Interpretation
                          </h4>
                          <div className="space-y-2.5">
                            {interpretations.map((item, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.06 }}
                                className="flex items-start gap-2.5"
                              >
                                <div
                                  className="w-[6px] h-[6px] rounded-full mt-[6px] flex-shrink-0"
                                  style={{ background: item.negative ? '#E88B8B' : '#4CAF7D' }}
                                />
                                <p className="text-[12px] text-[#2c2c2e] leading-[1.6]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {item.text}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </AnalysisCard>
                      </RevealSection>

                      {/* Stats Card */}
                      <RevealSection delay={0} visible={revealStage >= 6}>
                        <AnalysisCard>
                          <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                            Key Statistics
                          </h4>
                          <div className="grid grid-cols-5 gap-3">
                            {[
                              { label: 'Best yield', value: '41 mg/L', accent: true },
                              { label: 'Median yield', value: '33 mg/L', accent: false },
                              { label: 'Gain vs 37°C', value: '+128%', accent: true },
                              { label: 'Optimal IPTG', value: '0.10–0.25 mM', accent: false },
                              { label: 'Best condition', value: '25–30°C / low IPTG', accent: false },
                            ].map((stat, i) => (
                              <motion.div
                                key={stat.label}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: i * 0.08 }}
                                className="text-center rounded-[10px] px-3 py-3"
                                style={{
                                  background: stat.accent ? 'rgba(76,175,125,0.06)' : 'rgba(0,0,0,0.02)',
                                  border: `0.5px solid ${stat.accent ? 'rgba(76,175,125,0.12)' : 'rgba(0,0,0,0.04)'}`,
                                }}
                              >
                                <p
                                  className="text-[14px] font-bold mb-1"
                                  style={{
                                    color: stat.accent ? '#4CAF7D' : '#1d1d1f',
                                    fontFamily: "'JetBrains Mono', monospace",
                                  }}
                                >
                                  {stat.value}
                                </p>
                                <p className="text-[9px] font-semibold text-[#8e8e93] uppercase tracking-[0.04em]">
                                  {stat.label}
                                </p>
                              </motion.div>
                            ))}
                          </div>
                        </AnalysisCard>
                      </RevealSection>

                      {/* Literature Alignment */}
                      <RevealSection delay={0} visible={revealStage >= 7}>
                        <AnalysisCard>
                          <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                            Literature Alignment
                          </h4>
                          <div className="space-y-2.5">
                            {literatureInsights.map((insight, i) => (
                              <div key={i} className="flex items-start gap-2.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6AADD8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-[2px] flex-shrink-0">
                                  <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                                  <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                                </svg>
                                <p className="text-[12px] text-[#2c2c2e] leading-[1.6]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {insight}
                                </p>
                              </div>
                            ))}
                          </div>

                          <div className="mt-4 pt-3" style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>
                            <h5 className="text-[9px] font-bold text-[#b0b0b5] uppercase tracking-[0.06em] mb-2.5">
                              References
                            </h5>
                            <div className="space-y-1.5">
                              {references.map((ref, i) => (
                                <p key={i} className="text-[11px] text-[#8e8e93]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  <span className="text-[#6AADD8] font-medium">[{i + 1}]</span>{' '}
                                  {ref.authors} ({ref.year}) — <span className="italic">{ref.title}</span>
                                </p>
                              ))}
                            </div>
                          </div>
                        </AnalysisCard>
                      </RevealSection>

                      {/* Sylvy Internal References */}
                      <RevealSection delay={0} visible={revealStage >= 8}>
                        <AnalysisCard>
                          <h4 className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3">
                            Experiments Referenced
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {sylvyRefs.map((ref, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.3, delay: i * 0.06, ...springSmooth }}
                                className="flex items-center gap-2 rounded-full px-3 py-1.5"
                                style={{
                                  background: 'rgba(76,175,125,0.06)',
                                  border: '0.5px solid rgba(76,175,125,0.15)',
                                }}
                              >
                                <div className="w-[5px] h-[5px] rounded-full bg-[#4CAF7D]" />
                                <span className="text-[10px] font-medium text-[#2c2c2e]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                  {ref.project} / {ref.label} / {ref.exp}
                                </span>
                              </motion.div>
                            ))}
                          </div>
                        </AnalysisCard>
                      </RevealSection>

                      {/* Recommended Next Step */}
                      <RevealSection delay={0} visible={revealStage >= 9}>
                        <div
                          className="rounded-[16px] p-5"
                          style={{
                            background: 'linear-gradient(135deg, rgba(76,175,125,0.08) 0%, rgba(76,175,125,0.03) 100%)',
                            border: '0.5px solid rgba(76,175,125,0.18)',
                            boxShadow: '0 2px 8px rgba(76,175,125,0.06)',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10" />
                              <path d="M12 16v-4M12 8h.01" />
                            </svg>
                            <h4 className="text-[11px] font-bold text-[#4CAF7D] uppercase tracking-[0.06em]">
                              Recommended Next Step
                            </h4>
                          </div>
                          <p
                            className="text-[12.5px] text-[#2c2c2e] leading-[1.7]"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            Focus on <strong>25–30°C induction</strong>, <strong>0.05–0.10 mM IPTG</strong>, and <strong>overnight expression</strong>. Next optimization variable should be OD600 at induction to refine the productivity vs cell health trade-off.
                          </p>
                        </div>
                      </RevealSection>

                      {/* ─── Generate Report Action ─── */}
                      <RevealSection delay={0.1} visible={revealStage >= 9}>
                        <motion.div
                          className="pt-2"
                          style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}
                        >
                          <motion.button
                            onClick={handleGenerateReport}
                            disabled={reportLoading}
                            whileHover={reportLoading ? {} : { scale: 1.02, y: -1 }}
                            whileTap={reportLoading ? {} : { scale: 0.97 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-medium cursor-pointer transition-all"
                            style={{
                              background: reportLoading ? 'rgba(76,175,125,0.08)' : 'rgba(0,0,0,0.03)',
                              border: reportLoading ? '0.5px solid rgba(76,175,125,0.15)' : '0.5px solid rgba(0,0,0,0.06)',
                              color: reportLoading ? '#4CAF7D' : '#5a5a5c',
                            }}
                          >
                            {reportLoading ? (
                              <>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                  className="w-[14px] h-[14px] border-[1.5px] border-[#4CAF7D]/30 border-t-[#4CAF7D] rounded-full"
                                />
                                <AnimatePresence mode="wait">
                                  <motion.span
                                    key={reportStep}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {reportSteps[reportStep]}
                                  </motion.span>
                                </AnimatePresence>
                              </>
                            ) : (
                              <>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="3" y="3" width="18" height="18" rx="2" />
                                  <path d="M3 9h18" />
                                  <path d="M9 3v18" />
                                </svg>
                                Generate report
                              </>
                            )}
                          </motion.button>
                        </motion.div>
                      </RevealSection>
                    </div>
                  )}

                  {/* Simple loading indicator (non-GFP) */}
                  <AnimatePresence>
                    {isLoading && !isGfpAnalysis && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex items-center gap-2.5"
                      >
                        <div className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.1)' }}>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            className="w-[10px] h-[10px] border-[1.5px] border-[#4CAF7D]/30 border-t-[#4CAF7D] rounded-full"
                          />
                        </div>
                        <span className="text-[11px] text-[#8e8e93] font-medium">
                          Analyzing sources…
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <div ref={chatEndRef} />
                </div>
              )}
            </div>

            {/* Input Bar */}
            <div className="px-5 pb-5 pt-2">
              <div
                className="flex items-end gap-3 rounded-[18px] px-4 py-3 transition-all"
                style={{
                  background: 'rgba(0,0,0,0.025)',
                  border: '0.5px solid rgba(0,0,0,0.06)',
                }}
              >
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value)
                    // Auto-resize
                    e.target.style.height = 'auto'
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                      // Reset height after submit
                      if (inputRef.current) {
                        inputRef.current.style.height = 'auto'
                      }
                    }
                  }}
                  placeholder="Ask Sylvy Labmind a question…"
                  disabled={isLoading}
                  rows={1}
                  className="flex-1 bg-transparent text-[14px] text-[#1d1d1f] placeholder-[#b0b0b5] outline-none resize-none leading-[1.5]"
                  style={{ fontFamily: 'inherit', maxHeight: 160 }}
                />

                {sourceCount > 0 && (
                  <span
                    className="text-[10px] font-semibold text-[#8e8e93] px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.04)' }}
                  >
                    {sourceCount} source{sourceCount > 1 ? 's' : ''}
                  </span>
                )}

                <motion.button
                  onClick={handleSubmit}
                  whileHover={
                    inputValue.trim() && !isLoading ? { scale: 1.08 } : {}
                  }
                  whileTap={
                    inputValue.trim() && !isLoading ? { scale: 0.92 } : {}
                  }
                  className="w-[32px] h-[32px] rounded-full flex items-center justify-center flex-shrink-0 cursor-pointer transition-all"
                  style={{
                    background:
                      inputValue.trim() && !isLoading
                        ? 'linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)'
                        : 'rgba(0,0,0,0.06)',
                  }}
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={
                      inputValue.trim() && !isLoading ? '#ffffff' : '#b0b0b5'
                    }
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Full-screen Transition Overlay ─── */}
      <AnimatePresence>
        {reportLoading && reportStep === reportSteps.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #c8ddb8 0%, #a8c8a0 50%, #d0e0c0 100%)',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex flex-col items-center gap-3"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                className="w-[28px] h-[28px] border-[2px] border-[#4CAF7D]/25 border-t-[#4CAF7D] rounded-full"
              />
              <p className="text-[13px] font-medium text-[#3a3a3c]">Opening report…</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
