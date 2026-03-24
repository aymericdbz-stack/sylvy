'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

/* ─── Animation Presets ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const

const glass = {
  background: 'rgba(255, 255, 255, 0.78)',
  backdropFilter: 'blur(40px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
  boxShadow:
    '0 0.5px 0 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.04)',
  border: '0.5px solid rgba(255,255,255,0.5)',
} as const

/* ─── Types ─── */
type Discussion = {
  id: string
  title: string
  project: string
  projectAccent: string
  preview: string
  timestamp: string
  date: string
  sourcesCount: number
  question: string
  answer: string
  keyFactors: string[]
  stats: { label: string; value: string }[]
  sources: string[]
}

/* ─── Mock Data ─── */
const DISCUSSIONS: Discussion[] = [
  {
    id: 'd1',
    title: 'Main drivers of GFP production yield',
    project: 'GFP Expression Screening',
    projectAccent: '#4CAF7D',
    preview: 'Analysis of temperature, IPTG concentration, and expression time on soluble GFP yield across 5 experiments.',
    timestamp: '2 days ago',
    date: 'Mar 21, 2026',
    sourcesCount: 6,
    question: 'What are the main factors driving GFP production yield across my expression screening experiments?',
    answer: 'Based on analysis of 5 experiments in the GFP Expression Screening project, the three primary drivers of soluble GFP yield are induction temperature, IPTG concentration, and expression duration. Lower temperatures (20–25°C) consistently outperform 37°C by improving protein folding kinetics.',
    keyFactors: [
      'Temperature is the strongest predictor — 20°C yields 42.1 mg/L vs. 8.3 mg/L at 37°C',
      'Moderate IPTG (0.10–0.25 mM) balances expression rate with proper folding',
      'Extended expression time (16–20h) at low temperature maximizes soluble fraction',
      'High IPTG (1.0 mM) causes metabolic stress and reduces net efficiency by ~40%',
    ],
    stats: [
      { label: 'Best yield', value: '42.1 mg/L' },
      { label: 'Optimal temp', value: '20°C' },
      { label: 'Optimal IPTG', value: '0.10 mM' },
      { label: 'Experiments', value: '5' },
    ],
    sources: ['Expression screening Exp-01', 'Induction optimization Exp-03', 'Overnight expression Exp-04', 'High-IPTG comparison Exp-05', 'Fluorescence calibration', 'Expression protocol v3'],
  },
  {
    id: 'd2',
    title: 'HEK293 transfection optimization',
    project: 'HEK 293 Cell Assay',
    projectAccent: '#E8B44C',
    preview: 'Comparison of Lipofectamine 3000, PEI, and CaPO₄ transfection methods on GFP+ cell percentage and viability.',
    timestamp: '5 days ago',
    date: 'Mar 18, 2026',
    sourcesCount: 4,
    question: 'Which transfection reagent gives the best efficiency while maintaining cell viability for HEK293?',
    answer: 'Lipofectamine 3000 at 1.5 µg/mL provides the best overall transfection efficiency (78.3 ± 4.2%) while maintaining acceptable viability above 90%. PEI shows dose-dependent cytotoxicity above 2.0 µg/mL.',
    keyFactors: [
      'Lipofectamine 3000 yielded 78.3% GFP+ cells at 48h (MFI: 12,450 AU)',
      'Cell viability remained >90% across all Lipofectamine conditions',
      'PEI showed dose-dependent cytotoxicity above 2.0 µg/mL',
      'CaPO₄ transfection reached only 31.4% efficiency but with 82% viability',
    ],
    stats: [
      { label: 'Best efficiency', value: '78.3%' },
      { label: 'Best reagent', value: 'Lipo3000' },
      { label: 'Max viability', value: '92%' },
      { label: 'Methods tested', value: '3' },
    ],
    sources: ['Transfection report', 'HEK293 assay summary', 'Viability protocol', 'Flow cytometry export'],
  },
  {
    id: 'd3',
    title: 'CRISPR assay comparison',
    project: 'CRISPR-Cas9 Sequence A12',
    projectAccent: '#E88B8B',
    preview: 'Evaluation of guide RNA A12 editing efficiency at the AAVS1 locus with off-target analysis.',
    timestamp: '1 week ago',
    date: 'Mar 16, 2026',
    sourcesCount: 5,
    question: 'How does guide RNA A12 perform at the AAVS1 locus, and what is the off-target profile?',
    answer: 'Guide RNA sequence A12 achieves an on-target editing efficiency of 87.4% at the AAVS1 locus, with minimal detectable off-target activity. RNP delivery at 20 pmol per 200k cells is the optimal method.',
    keyFactors: [
      'On-target efficiency: 87.4 ± 3.1% by T7E1 assay',
      'Indel frequency at top off-target site: <0.3%',
      'Optimal delivery: RNP complex at 20 pmol per 200k cells',
      'Electroporation outperformed lipofection for RNP delivery by 12%',
    ],
    stats: [
      { label: 'On-target', value: '87.4%' },
      { label: 'Off-target', value: '<0.3%' },
      { label: 'Delivery', value: 'RNP' },
      { label: 'Guides tested', value: '3' },
    ],
    sources: ['Experiment report 01', 'Protocol draft', 'Result summary', 'Generated report', 'Cas9_efficiency.pdf'],
  },
  {
    id: 'd4',
    title: 'Protein expression summary',
    project: 'Protein Analysis PDB-1AON',
    projectAccent: '#6AADD8',
    preview: 'Structural characterization via CD spectroscopy and SEC confirming α-helical fold and monodispersity.',
    timestamp: '2 weeks ago',
    date: 'Mar 9, 2026',
    sourcesCount: 4,
    question: 'What does the CD spectrum and SEC data tell us about the folding and purity of the expressed protein?',
    answer: 'The CD spectrum shows characteristic double minima at 208 nm and 222 nm, confirming predominant α-helical secondary structure. SEC elution profile indicates a monodisperse peak with >95% purity.',
    keyFactors: [
      'CD minima at 208 nm and 222 nm confirm α-helical fold',
      'Estimated α-helix content: 62 ± 4% by CDNN deconvolution',
      'SEC shows single symmetric peak at expected MW (58.2 kDa)',
      'Purification yield after Ni-NTA + SEC: 12.8 mg per liter culture',
    ],
    stats: [
      { label: 'α-helix', value: '62%' },
      { label: 'Purity', value: '>95%' },
      { label: 'MW', value: '58.2 kDa' },
      { label: 'Yield', value: '12.8 mg/L' },
    ],
    sources: ['Purification log', 'CD spectrum analysis', 'SEC elution data', 'Protocol v2'],
  },
]

/* ─── Icons ─── */
function SearchIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

/* ─── Inline Choice Card ─── */
function ChoiceCard({
  icon,
  label,
  description,
  onClick,
  delay = 0,
}: {
  icon: React.ReactNode
  label: string
  description: string
  onClick: () => void
  delay?: number
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay, ease }}
      onClick={onClick}
      whileHover={{ scale: 1.015, y: -1 }}
      whileTap={{ scale: 0.99 }}
      className="flex items-center gap-3.5 w-full text-left px-4 py-3.5 rounded-[12px] cursor-pointer transition-colors"
      style={{
        background: 'rgba(255,255,255,0.6)',
        border: '0.5px solid rgba(0,0,0,0.06)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
      }}
    >
      <div
        className="w-[40px] h-[40px] rounded-[10px] flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.025)' }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-[#1d1d1f]">{label}</p>
        <p className="text-[10px] text-[#8e8e93] mt-0.5 leading-[1.4]">{description}</p>
      </div>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c7c7cc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 18l6-6-6-6" />
      </svg>
    </motion.button>
  )
}

/* ─── Labmind Assistant Bubble ─── */
function AssistantBubble({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease }}
      className="flex items-start gap-2.5 mt-4"
    >
      <div
        className="w-[26px] h-[26px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'linear-gradient(135deg, #2d7a54, #4CAF7D)' }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
          <path d="M12 2a7 7 0 0 1 7 7c0 3-2 5.5-4 7l-3 3-3-3c-2-1.5-4-4-4-7a7 7 0 0 1 7-7z" />
          <circle cx="12" cy="9" r="1.5" fill="white" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export default function LabmindHistoryPage() {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState(DISCUSSIONS[0].id)
  const [search, setSearch] = useState('')

  /* Report generation flow state */
  type FlowStep = 'idle' | 'ask_type' | 'ask_format' | 'generating'
  const [flowStep, setFlowStep] = useState<FlowStep>('idle')
  const [chosenType, setChosenType] = useState<'written' | 'presentation' | null>(null)
  const [chosenFormat, setChosenFormat] = useState<'talk' | 'poster' | null>(null)
  const [loadingStep, setLoadingStep] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  const generationSteps = [
    'Structuring scientific content…',
    'Selecting the best format…',
    'Designing layout…',
    'Generating editable output…',
  ]

  /* Start the flow */
  const handleGenerateReport = useCallback(() => {
    setFlowStep('ask_type')
    setChosenType(null)
    setChosenFormat(null)
    setLoadingStep(0)
  }, [])

  /* Step 1 choice */
  const handleChooseType = useCallback((type: 'written' | 'presentation') => {
    setChosenType(type)
    if (type === 'written') {
      setFlowStep('generating')
      setLoadingStep(0)
    } else {
      setFlowStep('ask_format')
    }
  }, [])

  /* Step 2 choice */
  const handleChooseFormat = useCallback((format: 'talk' | 'poster') => {
    setChosenFormat(format)
    setFlowStep('generating')
    setLoadingStep(0)
  }, [])

  /* Scroll to bottom when flow steps change */
  useEffect(() => {
    if (flowStep !== 'idle' && scrollRef.current) {
      setTimeout(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }, 100)
    }
  }, [flowStep, chosenType, chosenFormat, loadingStep])

  /* Loading step progression */
  useEffect(() => {
    if (flowStep !== 'generating') return
    if (loadingStep < generationSteps.length - 1) {
      const t = setTimeout(() => setLoadingStep((s) => s + 1), 650)
      return () => clearTimeout(t)
    } else {
      let route = '/demo/report'
      if (chosenType === 'presentation' && chosenFormat === 'poster') {
        route = '/demo/report-poster'
      }
      const t = setTimeout(() => router.push(route), 700)
      return () => clearTimeout(t)
    }
  }, [flowStep, loadingStep, router, chosenType, chosenFormat, generationSteps.length])

  /* Reset flow when switching discussion */
  useEffect(() => {
    setFlowStep('idle')
    setChosenType(null)
    setChosenFormat(null)
    setLoadingStep(0)
  }, [selectedId])

  const filtered = DISCUSSIONS.filter(
    (d) =>
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.project.toLowerCase().includes(search.toLowerCase())
  )

  const selected = DISCUSSIONS.find((d) => d.id === selectedId) ?? DISCUSSIONS[0]

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
          className="flex items-center justify-between px-1"
        >
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push('/demo')}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-black/[0.04]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              Labmind History
            </h1>
          </div>

          <motion.button
            onClick={() => router.push('/demo/labmind-new')}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] text-[13px] font-semibold text-[#1d1d1f] cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 0.5px 0 0 rgba(255,255,255,0.7) inset, 0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
              border: '0.5px solid rgba(255,255,255,0.6)',
            }}
          >
            <PlusIcon />
            New discussion
          </motion.button>
        </motion.div>
      </div>

      {/* ─── Main Two-Column Layout ─── */}
      <div className="mx-auto max-w-[1400px] px-6 py-6 md:py-8">
        <div className="flex gap-5 items-start" style={{ minHeight: 'calc(100vh - 140px)' }}>

          {/* ═══ LEFT COLUMN — Past Discussions ═══ */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="w-[380px] flex-shrink-0 rounded-[22px] flex flex-col"
            style={{ ...glass, maxHeight: 'calc(100vh - 160px)' }}
          >
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                Past discussions
              </h2>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-[10px]"
                style={{
                  background: 'rgba(0,0,0,0.03)',
                  border: '0.5px solid rgba(0,0,0,0.06)',
                }}
              >
                <SearchIcon />
                <input
                  type="text"
                  placeholder="Search discussions"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1 bg-transparent text-[13px] text-[#1d1d1f] placeholder:text-[#b0b0b5] outline-none"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4" style={{ scrollbarWidth: 'none' }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  <div className="w-12 h-12 rounded-full bg-black/[0.03] flex items-center justify-center mb-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#b0b0b5" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <p className="text-[13px] font-medium text-[#8e8e93] text-center">No discussions found</p>
                  <p className="text-[11px] text-[#b0b0b5] mt-1 text-center">Try a different search term</p>
                </div>
              ) : (
                filtered.map((d, i) => {
                  const isActive = d.id === selectedId
                  return (
                    <motion.button
                      key={d.id}
                      onClick={() => setSelectedId(d.id)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.15 + i * 0.05, ease }}
                      whileHover={{ scale: 1.01 }}
                      className={`w-full text-left px-4 py-3.5 rounded-[14px] mb-1.5 cursor-pointer transition-colors ${
                        isActive ? 'bg-white/70' : 'hover:bg-white/40'
                      }`}
                      style={
                        isActive
                          ? {
                              boxShadow: '0 1px 4px rgba(0,0,0,0.04), 0 0.5px 0 rgba(255,255,255,0.5) inset',
                              border: '0.5px solid rgba(0,0,0,0.04)',
                            }
                          : { border: '0.5px solid transparent' }
                      }
                    >
                      <p className="text-[13px] font-semibold text-[#1d1d1f] leading-tight mb-1">{d.title}</p>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: `${d.projectAccent}18`, color: d.projectAccent }}
                        >
                          {d.project}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8e8e93] leading-[1.4] line-clamp-2 mb-1.5">{d.preview}</p>
                      <p className="text-[10px] text-[#b0b0b5]">{d.timestamp}</p>
                    </motion.button>
                  )
                })
              )}
            </div>
          </motion.div>

          {/* ═══ RIGHT COLUMN — Discussion Preview ═══ */}
          <motion.div
            ref={scrollRef}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease }}
            className="flex-1 rounded-[22px] overflow-y-auto"
            style={{ ...glass, maxHeight: 'calc(100vh - 160px)', scrollbarWidth: 'none' } as React.CSSProperties}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={selected.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease }}
                className="p-8"
              >
                {/* Title & Meta */}
                <div className="mb-6">
                  <h2 className="text-[20px] font-semibold text-[#1d1d1f] tracking-[-0.01em] mb-2">
                    {selected.title}
                  </h2>
                  <div className="flex items-center gap-3">
                    <span
                      className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full"
                      style={{ background: `${selected.projectAccent}18`, color: selected.projectAccent }}
                    >
                      {selected.project}
                    </span>
                    <span className="text-[11px] text-[#b0b0b5]">{selected.sourcesCount} sources</span>
                    <span className="text-[11px] text-[#b0b0b5]">{selected.date}</span>
                  </div>
                </div>

                {/* User Question */}
                <div
                  className="rounded-[14px] px-5 py-4 mb-5"
                  style={{ background: 'rgba(0,0,0,0.025)', border: '0.5px solid rgba(0,0,0,0.05)' }}
                >
                  <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-2">Question</p>
                  <p className="text-[13px] text-[#1d1d1f] leading-[1.55]">{selected.question}</p>
                </div>

                {/* Answer */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-2 px-1">Analysis</p>
                  <p className="text-[13px] text-[#3a3a3c] leading-[1.6] px-1">{selected.answer}</p>
                </div>

                {/* Key Factors */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3 px-1">Key factors</p>
                  <div className="space-y-2">
                    {selected.keyFactors.map((factor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 + i * 0.06, ease }}
                        className="flex items-start gap-3 px-4 py-2.5 rounded-[10px]"
                        style={{ background: 'rgba(76,175,125,0.04)', border: '0.5px solid rgba(76,175,125,0.08)' }}
                      >
                        <span className="text-[11px] text-[#4CAF7D] mt-0.5 flex-shrink-0 font-semibold">{i + 1}.</span>
                        <p className="text-[12px] text-[#3a3a3c] leading-[1.5]">{factor}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Stats */}
                <div className="mb-5">
                  <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3 px-1">Summary</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    {selected.stats.map((stat, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: 0.2 + i * 0.05, ease }}
                        className="rounded-[12px] px-3 py-3 text-center"
                        style={{ background: 'rgba(0,0,0,0.02)', border: '0.5px solid rgba(0,0,0,0.05)' }}
                      >
                        <p className="text-[15px] font-bold text-[#1d1d1f] mb-0.5">{stat.value}</p>
                        <p className="text-[10px] text-[#8e8e93] uppercase tracking-[0.04em]">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Sources */}
                <div>
                  <p className="text-[10px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-3 px-1">Sources referenced</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.sources.map((source, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.25, delay: 0.25 + i * 0.04, ease }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#5a5a5c] px-3 py-1.5 rounded-full"
                        style={{ background: 'rgba(0,0,0,0.03)', border: '0.5px solid rgba(0,0,0,0.06)' }}
                      >
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#8e8e93" strokeWidth="2" strokeLinecap="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                        </svg>
                        {source}
                      </motion.span>
                    ))}
                  </div>
                </div>

                {/* ─── Generate Report Action ─── */}
                {flowStep === 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5, ease }}
                    className="mt-6 pt-5"
                    style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}
                  >
                    <motion.button
                      onClick={handleGenerateReport}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-[10px] text-[12px] font-medium cursor-pointer transition-all"
                      style={{
                        background: 'rgba(0,0,0,0.03)',
                        border: '0.5px solid rgba(0,0,0,0.06)',
                        color: '#5a5a5c',
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <path d="M3 9h18" />
                        <path d="M9 3v18" />
                      </svg>
                      Generate report
                    </motion.button>
                  </motion.div>
                )}

                {/* ─── Conversational Report Flow ─── */}
                {flowStep !== 'idle' && (
                  <div className="mt-6 pt-5" style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }}>

                    {/* Step 1: Ask report type */}
                    <AssistantBubble delay={0.05}>
                      <p className="text-[12px] font-semibold text-[#1d1d1f] mb-3">
                        What type of report would you like to generate?
                      </p>
                      {!chosenType ? (
                        <div className="flex flex-col gap-2 max-w-[380px]">
                          <ChoiceCard
                            icon={
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                <path d="M14 2v6h6" />
                                <path d="M16 13H8" />
                                <path d="M16 17H8" />
                              </svg>
                            }
                            label="Written report"
                            description="Structured scientific document with editable sections"
                            onClick={() => handleChooseType('written')}
                            delay={0.1}
                          />
                          <ChoiceCard
                            icon={
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6AADD8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <path d="M8 21h8" />
                                <path d="M12 17v4" />
                              </svg>
                            }
                            label="Presentation"
                            description="Visual format for talks or conference posters"
                            onClick={() => handleChooseType('presentation')}
                            delay={0.15}
                          />
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                          style={{
                            background: chosenType === 'written' ? 'rgba(76,175,125,0.08)' : 'rgba(106,173,216,0.08)',
                            color: chosenType === 'written' ? '#4CAF7D' : '#6AADD8',
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          {chosenType === 'written' ? 'Written report' : 'Presentation'}
                        </motion.div>
                      )}
                    </AssistantBubble>

                    {/* Step 2: Ask presentation format (only if presentation chosen) */}
                    {chosenType === 'presentation' && flowStep !== 'ask_type' && (
                      <AssistantBubble delay={0.1}>
                        <p className="text-[12px] font-semibold text-[#1d1d1f] mb-3">
                          What presentation format would you like?
                        </p>
                        {!chosenFormat ? (
                          <div className="flex flex-col gap-2 max-w-[380px]">
                            <ChoiceCard
                              icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6AADD8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="2" y="4" width="20" height="14" rx="2" />
                                  <path d="M7 9h5" />
                                  <path d="M7 12h3" />
                                </svg>
                              }
                              label="Talk format"
                              description="Landscape slides for oral presentation"
                              onClick={() => handleChooseFormat('talk')}
                              delay={0.1}
                            />
                            <ChoiceCard
                              icon={
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8A030" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="5" y="2" width="14" height="20" rx="2" />
                                  <path d="M9 6h6" />
                                  <path d="M9 10h6" />
                                  <path d="M9 14h3" />
                                </svg>
                              }
                              label="Poster format"
                              description="Portrait scientific poster for conferences"
                              onClick={() => handleChooseFormat('poster')}
                              delay={0.15}
                            />
                          </div>
                        ) : (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[11px] font-semibold"
                            style={{
                              background: chosenFormat === 'talk' ? 'rgba(106,173,216,0.08)' : 'rgba(232,160,48,0.08)',
                              color: chosenFormat === 'talk' ? '#6AADD8' : '#E8A030',
                            }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                            {chosenFormat === 'talk' ? 'Talk format' : 'Poster format'}
                          </motion.div>
                        )}
                      </AssistantBubble>
                    )}

                    {/* Generation Loading */}
                    {flowStep === 'generating' && (
                      <AssistantBubble delay={0.1}>
                        <div className="flex items-start gap-3">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                            className="w-[16px] h-[16px] border-[1.5px] border-[#4CAF7D]/25 border-t-[#4CAF7D] rounded-full flex-shrink-0 mt-0.5"
                          />
                          <div className="flex flex-col gap-1.5">
                            {generationSteps.map((step, i) => {
                              const isActive = i === loadingStep
                              const isDone = i < loadingStep
                              return (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, x: -6 }}
                                  animate={{ opacity: isDone ? 0.4 : isActive ? 1 : 0.25, x: 0 }}
                                  transition={{ duration: 0.25, delay: i * 0.04, ease }}
                                  className="flex items-center gap-2"
                                >
                                  {isDone ? (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="3" strokeLinecap="round">
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    </motion.div>
                                  ) : isActive ? (
                                    <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-[11px] h-[11px] flex items-center justify-center">
                                      <div className="w-[5px] h-[5px] rounded-full bg-[#4CAF7D]" />
                                    </motion.div>
                                  ) : (
                                    <div className="w-[11px] h-[11px] flex items-center justify-center">
                                      <div className="w-[4px] h-[4px] rounded-full bg-[#d0d0d5]" />
                                    </div>
                                  )}
                                  <span className="text-[11px]" style={{ color: isActive ? '#1d1d1f' : isDone ? '#8e8e93' : '#c7c7cc', fontWeight: isActive ? 600 : 400 }}>
                                    {step}
                                  </span>
                                </motion.div>
                              )
                            })}
                          </div>
                        </div>
                      </AssistantBubble>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* ─── Full-screen Transition Overlay ─── */}
      <AnimatePresence>
        {flowStep === 'generating' && loadingStep === generationSteps.length - 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="fixed inset-0 z-[60] flex items-center justify-center"
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
