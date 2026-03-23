'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

/* ─── Animation Presets ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const

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
]

/* ─── Fake AI responses keyed by partial question match ─── */
const fakeResponses: { match: RegExp; response: Omit<Message, 'id' | 'role'> }[] = [
  {
    match: /concentrat|transfect|hek\s*293|efficiency/i,
    response: {
      content:
        'Based on the selected reports, Lipofectamine 3000 at 1.5 µg/mL provides the best overall transfection efficiency (78.3 ± 4.2%) while maintaining acceptable viability above 90%. PEI at the same concentration achieves moderate efficiency (52.1%) but with reduced viability at 78%.',
      bullets: [
        'Lipofectamine 3000 yielded 78.3% GFP+ cells at 48h (MFI: 12,450 AU)',
        'Cell viability remained >90% across all Lipofectamine conditions',
        'PEI showed dose-dependent cytotoxicity above 2.0 µg/mL',
        'Calcium phosphate method had highest batch-to-batch variability (CV ~25%)',
      ],
      sources: ['Transfection report', 'HEK293 assay summary', 'Viability protocol'],
    },
  },
  {
    match: /crispr|cas9|sequence|guide|editing/i,
    response: {
      content:
        'Analysis of the CRISPR-Cas9 targeting data indicates that guide RNA sequence A12 achieves an on-target editing efficiency of 87.4% at the AAVS1 locus, with minimal detectable off-target activity across the top 10 predicted sites.',
      bullets: [
        'On-target efficiency: 87.4 ± 3.1% by T7E1 assay',
        'Indel frequency at top off-target site: <0.3%',
        'Optimal delivery: RNP complex at 20 pmol per 200k cells',
        'Peak editing observed at 72h post-electroporation',
      ],
      sources: ['Experiment report 01', 'Result summary', 'Cas9_efficiency.pdf'],
    },
  },
  {
    match: /protein|purif|fold|structur|cd\s*spectr|pdb/i,
    response: {
      content:
        'The recombinant protein PDB-1AON shows a predominantly α-helical secondary structure (38% α-helix, 18% β-sheet) with a melting temperature of 52.4 ± 0.8°C. The SEC profile confirms a stable tetrameric assembly at physiological conditions.',
      bullets: [
        'Final yield: 12.4 mg purified protein per liter of culture',
        'Purity >95% by SDS-PAGE (single band at 57.3 kDa)',
        'CD spectrum: characteristic double minima at 208 and 222 nm',
        'MALDI-TOF mass within 0.1% of predicted molecular weight',
      ],
      sources: ['Purification log', 'CD spectrum analysis', 'SEC elution data'],
    },
  },
]

const defaultResponse: Omit<Message, 'id' | 'role'> = {
  content:
    'Based on the selected sources, I can provide an analysis of the relevant experimental data. The results indicate consistent findings across the referenced materials with statistically significant outcomes in the primary endpoints.',
  bullets: [
    'Key findings are reproducible across experimental replicates',
    'Statistical significance achieved (p < 0.05) for primary endpoints',
    'Methodology follows established protocols with appropriate controls',
    'Further investigation recommended for secondary observations',
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

/* ─── Component ─── */
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
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const currentProject = projects.find((p) => p.id === selectedProject)

  /* ── Scroll to bottom on new message ── */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

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

    setTimeout(() => {
      const matched = fakeResponses.find((r) => r.match.test(q))
      const resp = matched?.response || defaultResponse

      // Use matched sources or fallback to selected source titles
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
            onClick={() => router.push('/demo')}
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
            className="object-contain flex-shrink-0"
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
                              {/* Checkbox */}
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
                    {/* External Source Options */}
                    {[
                      {
                        label: 'Upload PDF',
                        type: 'pdf' as const,
                        icon: (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
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
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
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
            }}
          >
            {/* Panel Header */}
            <div className="px-7 pt-5 pb-4">
              <h2 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em]">
                Discussion
              </h2>
            </div>

            <div style={{ borderTop: '0.5px solid rgba(0,0,0,0.05)' }} />

            {/* Chat Area */}
            <div className="flex-1 px-7 py-5 overflow-y-auto">
              {!hasMessages ? (
                /* Empty State */
                <div className="h-full flex flex-col items-center justify-center py-16">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.4, ease }}
                    className="text-center"
                  >
                    {/* Labmind Icon */}
                    <div className="mx-auto mb-5 w-[52px] h-[52px] rounded-[14px] flex items-center justify-center" style={{ background: 'rgba(76,175,125,0.08)' }}>
                      <svg
                        width="26"
                        height="26"
                        viewBox="0 0 24 24"
                        fill="none"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path
                          d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7-.5.8-.8 1.7-.8 2.6C6 19.5 7.8 21 10 21.5"
                          stroke="#4CAF7D"
                        />
                        <path
                          d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7.5.8.8 1.7.8 2.6 0 2-1.8 3.5-4 4"
                          stroke="#4CAF7D"
                        />
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
                        /* User Message */
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
                        /* Assistant Message */
                        <div className="max-w-[92%]">
                          <div className="flex items-center gap-2 mb-2.5">
                            <div
                              className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center"
                              style={{ background: 'rgba(76,175,125,0.1)' }}
                            >
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#4CAF7D"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 2C9.5 2 8 3.5 8 5.5c0 .5.1 1 .3 1.4C6.4 7.5 5 9.2 5 11.2c0 1.5.7 2.8 1.8 3.7" />
                                <path d="M12 2c2.5 0 4 1.5 4 3.5 0 .5-.1 1-.3 1.4 1.9.6 3.3 2.3 3.3 4.3 0 1.5-.7 2.8-1.8 3.7" />
                              </svg>
                            </div>
                            <span className="text-[11px] font-semibold text-[#4CAF7D] uppercase tracking-[0.04em]">
                              Labmind
                            </span>
                          </div>

                          <p
                            className="text-[14px] text-[#2c2c2e] leading-[1.7] mb-3"
                            style={{
                              fontFamily:
                                "'JetBrains Mono', 'SF Mono', monospace",
                              fontSize: '12.5px',
                            }}
                          >
                            {msg.content}
                          </p>

                          {/* Bullet Points */}
                          {msg.bullets && msg.bullets.length > 0 && (
                            <div
                              className="rounded-[10px] px-4 py-3 mb-3 space-y-1.5"
                              style={{
                                background: 'rgba(0,0,0,0.02)',
                                border: '0.5px solid rgba(0,0,0,0.04)',
                              }}
                            >
                              {msg.bullets.map((b, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <div
                                    className="w-[4px] h-[4px] rounded-full bg-[#4CAF7D] mt-[7px] flex-shrink-0"
                                    style={{ opacity: 0.6 }}
                                  />
                                  <p
                                    className="text-[12px] text-[#3c3c43] leading-[1.6]"
                                    style={{
                                      fontFamily:
                                        "'JetBrains Mono', monospace",
                                    }}
                                  >
                                    {b}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Source Pills */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {msg.sources.map((s, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] font-semibold uppercase tracking-[0.04em] px-2.5 py-1 rounded-full"
                                  style={{
                                    background: 'rgba(76,175,125,0.08)',
                                    color: '#4CAF7D',
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  ))}

                  {/* Loading Indicator */}
                  <AnimatePresence>
                    {isLoading && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3, ease }}
                        className="flex items-center gap-2.5"
                      >
                        <div
                          className="w-[22px] h-[22px] rounded-[6px] flex items-center justify-center"
                          style={{ background: 'rgba(76,175,125,0.1)' }}
                        >
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{
                              duration: 1.2,
                              repeat: Infinity,
                              ease: 'linear',
                            }}
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
                className="flex items-center gap-3 rounded-[14px] px-4 py-3 transition-all"
                style={{
                  background: 'rgba(0,0,0,0.025)',
                  border: '0.5px solid rgba(0,0,0,0.06)',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="Ask Sylvy Labmind a question…"
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[14px] text-[#1d1d1f] placeholder-[#b0b0b5] outline-none"
                  style={{ fontFamily: 'inherit' }}
                />

                {/* Source Count */}
                {sourceCount > 0 && (
                  <span
                    className="text-[10px] font-semibold text-[#8e8e93] px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(0,0,0,0.04)' }}
                  >
                    {sourceCount} source{sourceCount > 1 ? 's' : ''}
                  </span>
                )}

                {/* Send Button */}
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
    </div>
  )
}
