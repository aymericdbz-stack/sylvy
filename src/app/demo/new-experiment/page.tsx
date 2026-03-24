'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

/* ─── Animation Presets ─── */
const ease = [0.25, 0.46, 0.45, 0.94] as const

/* ─── Glass Card Style ─── */
const glass = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(40px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
  boxShadow:
    '0 0.5px 0 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.04)',
  border: '0.5px solid rgba(255,255,255,0.5)',
} as const

/* ─── Template Data ─── */
const templates = [
  { id: 'assay', name: 'Standard assay report' },
  { id: 'protein', name: 'Protein analysis report' },
  { id: 'cell', name: 'Cell experiment report' },
]

const templateSections: Record<string, { title: string; placeholder: string }[]> = {
  assay: [
    { title: 'Tags', placeholder: 'Keywords and categories for this experiment...' },
    { title: 'Abstract', placeholder: 'Brief summary of the assay objectives and key findings...' },
    { title: 'Methods', placeholder: 'Detailed experimental procedures and materials used...' },
    { title: 'Results', placeholder: 'Quantitative and qualitative results from the assay...' },
    { title: 'Discussion', placeholder: 'Interpretation of results and comparison with literature...' },
    { title: 'Conclusion', placeholder: 'Summary of findings and next steps...' },
  ],
  protein: [
    { title: 'Tags', placeholder: 'Keywords and categories for this experiment...' },
    { title: 'Abstract', placeholder: 'Overview of protein analysis objectives...' },
    { title: 'Sample Preparation', placeholder: 'Protein extraction and purification steps...' },
    { title: 'Analysis Methods', placeholder: 'SDS-PAGE, Western blot, mass spectrometry details...' },
    { title: 'Results', placeholder: 'Protein expression levels, molecular weights, interactions...' },
    { title: 'Discussion', placeholder: 'Structural and functional implications...' },
    { title: 'Conclusion', placeholder: 'Key findings and recommendations...' },
  ],
  cell: [
    { title: 'Tags', placeholder: 'Keywords and categories for this experiment...' },
    { title: 'Abstract', placeholder: 'Cell experiment overview and hypothesis...' },
    { title: 'Cell Culture', placeholder: 'Cell line, passage number, culture conditions...' },
    { title: 'Treatment Protocol', placeholder: 'Reagents, concentrations, and exposure times...' },
    { title: 'Results', placeholder: 'Cell viability, morphology, and marker expression...' },
    { title: 'Discussion', placeholder: 'Biological significance and mechanistic insights...' },
    { title: 'Conclusion', placeholder: 'Summary and future directions...' },
  ],
}

/* ─── Inline SVG Icons ─── */
const UploadIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#b0b0b5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
)

const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="#8e8e93"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const SparkleIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
  </svg>
)

/* ─── Loading Messages ─── */
const loadingMessages = [
  'Generating report...',
  'Structuring experimental context...',
  'Preparing first draft...',
]

/* ─── New Experiment Page ─── */
export default function NewExperimentPage() {
  const router = useRouter()
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [guidelinesText, setGuidelinesText] = useState('')
  const [guidelinesFocused, setGuidelinesFocused] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)

  const sections = selectedTemplate ? templateSections[selectedTemplate] || [] : []
  const selectedName = templates.find(t => t.id === selectedTemplate)?.name

  const handleGenerate = useCallback(() => {
    if (!selectedTemplate || generating) return
    setGenerating(true)
    setLoadingStep(0)

    // Store selected template for the report page
    localStorage.setItem('sylvy-demo-current-template', selectedTemplate)

    // Cycle through loading messages then navigate
    const t1 = setTimeout(() => setLoadingStep(1), 1000)
    const t2 = setTimeout(() => setLoadingStep(2), 2200)
    const t3 = setTimeout(() => {
      router.push('/demo/report')
    }, 3200)

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [selectedTemplate, generating, router])

  return (
    <div
      className="min-h-screen w-full relative overflow-hidden"
      style={{
        background: 'linear-gradient(145deg, #c8ddb8 0%, #a8c8a0 25%, #b8d4a8 50%, #c0d8b0 75%, #d0e0c0 100%)',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif",
      }}
    >
      {/* Decorative gradient orbs */}
      <div
        className="pointer-events-none absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full opacity-40"
        style={{ background: 'radial-gradient(circle, rgba(180,220,160,0.7) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full opacity-30"
        style={{ background: 'radial-gradient(circle, rgba(160,200,140,0.6) 0%, transparent 70%)' }}
      />

      <div className="relative z-10 mx-auto max-w-[1000px] px-6 py-10 md:py-14">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.05, ease }}
          className="mb-10 flex items-center gap-3 px-1"
        >
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
            New Experiment
          </h1>
        </motion.div>

        {/* ─── Two Column Layout ─── */}
        <div className="grid grid-cols-2 gap-6 items-start">
          {/* ─── Left Column ─── */}
          <div className="flex flex-col gap-6">
            {/* Upload Resources Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease }}
              className="rounded-[22px] overflow-hidden"
              style={glass}
            >
              <div className="p-6 pb-2">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Upload Resources</h2>
              </div>
              <div className="px-6 pb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 0) setUploadedFiles((prev) => [...prev, ...files])
                    e.target.value = ''
                  }}
                />
                <div
                  className="relative rounded-[16px] border-[1.5px] border-dashed transition-all duration-200 cursor-pointer"
                  style={{
                    borderColor: dragOver ? 'rgba(76,175,125,0.5)' : 'rgba(0,0,0,0.08)',
                    background: dragOver ? 'rgba(76,175,125,0.04)' : 'rgba(0,0,0,0.015)',
                    minHeight: 200,
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    const files = Array.from(e.dataTransfer.files)
                    if (files.length > 0) setUploadedFiles((prev) => [...prev, ...files])
                  }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center h-full py-14 gap-4">
                    <motion.div
                      animate={{ y: dragOver ? -4 : 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <UploadIcon />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-[13px] text-[#8e8e93]">
                        Drag & drop files here, or{' '}
                        <span className="text-[#4CAF7D] font-medium cursor-pointer hover:underline">browse</span>
                      </p>
                      <p className="text-[11px] text-[#b0b0b5] mt-1.5">
                        All file types accepted
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded files list */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5">
                    {uploadedFiles.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="flex items-center justify-between rounded-[10px] px-3 py-2 text-[12px]"
                        style={{ background: 'rgba(0,0,0,0.03)' }}
                      >
                        <span className="text-[#1d1d1f] truncate mr-2">{file.name}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))
                          }}
                          className="text-[#b0b0b5] hover:text-[#ff3b30] transition-colors flex-shrink-0 cursor-pointer"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>

            {/* Guidelines Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease }}
              className="rounded-[22px] overflow-hidden transition-shadow duration-200"
              style={{
                ...glass,
                ...(guidelinesFocused ? {
                  boxShadow: '0 0.5px 0 0 rgba(255,255,255,0.8) inset, 0 2px 12px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.06)',
                  background: 'rgba(255, 255, 255, 0.88)',
                } : {}),
              }}
            >
              <div className="p-6 pb-2">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Guidelines</h2>
              </div>
              <div className="px-6 pb-6">
                <textarea
                  value={guidelinesText}
                  onChange={(e) => setGuidelinesText(e.target.value)}
                  onFocus={() => setGuidelinesFocused(true)}
                  onBlur={() => setGuidelinesFocused(false)}
                  placeholder="Provide experimental context and report guidelines..."
                  className="w-full bg-transparent text-[14px] text-[#1d1d1f] placeholder-[#b0b0b5] outline-none resize-none leading-relaxed"
                  style={{ fontFamily: 'inherit', minHeight: 120 }}
                />
              </div>
            </motion.div>
          </div>

          {/* ─── Right Column (30-35%) ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="flex flex-col gap-6"
          >
            {/* Template Section */}
            <div className="rounded-[22px]" style={glass}>
              <div className="p-6 pb-2 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#1d1d1f]">Template</h2>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="flex items-center gap-1 rounded-[10px] px-3 py-1.5 text-[12px] font-medium text-[#3c3c43] cursor-pointer transition-all"
                  style={{
                    background: 'rgba(0,0,0,0.03)',
                    border: '0.5px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  New
                </motion.button>
              </div>

              {/* Dropdown trigger */}
              <div className="px-6 pb-6">
                <motion.button
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between rounded-[14px] px-4 py-3 text-[13px] cursor-pointer transition-all duration-200"
                  style={{
                    background: dropdownOpen ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.02)',
                    border: '0.5px solid rgba(0,0,0,0.06)',
                  }}
                >
                  <span className={selectedName ? 'text-[#1d1d1f] font-medium' : 'text-[#b0b0b5]'}>
                    {selectedName || 'Choose template'}
                  </span>
                  <ChevronIcon open={dropdownOpen} />
                </motion.button>
              </div>
            </div>

            {/* Dropdown Menu — outside glass card to avoid stacking context */}
            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.2, ease }}
                  className="rounded-[14px] overflow-hidden -mt-4 relative z-50"
                  style={{
                    background: 'rgba(255,255,255,0.95)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06)',
                    border: '0.5px solid rgba(255,255,255,0.5)',
                  }}
                >
                  {templates.map((t, i) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTemplate(t.id)
                        setDropdownOpen(false)
                      }}
                      className="w-full text-left px-4 py-3 text-[13px] text-[#1d1d1f] cursor-pointer transition-colors duration-150 hover:bg-black/[0.03]"
                      style={{
                        borderBottom: i < templates.length - 1 ? '0.5px solid rgba(0,0,0,0.06)' : 'none',
                        fontFamily: 'inherit',
                        background: selectedTemplate === t.id ? 'rgba(76,175,125,0.06)' : 'transparent',
                      }}
                    >
                      <span className={selectedTemplate === t.id ? 'font-medium' : ''}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Template Preview */}
            <AnimatePresence mode="wait">
              {selectedTemplate && (
                <motion.div
                  key={selectedTemplate}
                  initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
                  transition={{ duration: 0.45, ease }}
                  className="rounded-[22px] overflow-hidden"
                  style={glass}
                >
                  <div className="p-5">
                    <p className="text-[11px] font-medium text-[#8e8e93] uppercase tracking-[0.06em] mb-4">
                      Report Structure
                    </p>
                    <div className="flex flex-col gap-2.5">
                      {sections.map((section, i) => (
                        <motion.div
                          key={section.title}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.35, delay: 0.06 * i, ease }}
                          className="rounded-[12px] px-4 py-3 transition-colors duration-150 hover:bg-black/[0.02]"
                          style={{ background: 'rgba(0,0,0,0.02)' }}
                        >
                          <div className="flex items-center gap-2.5 mb-1">
                            <div
                              className="w-[5px] h-[5px] rounded-full flex-shrink-0"
                              style={{ background: '#4CAF7D', opacity: 0.6 }}
                            />
                            <span className="text-[13px] font-medium text-[#1d1d1f]">
                              {section.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#b0b0b5] leading-relaxed ml-[15px]">
                            {section.placeholder}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* ─── Generate Button ─── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="flex justify-end mt-8 mb-6"
        >
          <motion.button
            whileHover={!generating ? { scale: 1.02, y: -2 } : {}}
            whileTap={!generating ? { scale: 0.97 } : {}}
            onClick={handleGenerate}
            className="flex items-center gap-2 rounded-[14px] px-7 py-3.5 text-[14px] font-semibold text-white cursor-pointer"
            style={{
              background: 'linear-gradient(135deg, #E8A838 0%, #D4943C 100%)',
              boxShadow: '0 2px 8px rgba(228,168,56,0.25), 0 8px 24px rgba(228,168,56,0.15), 0 0.5px 0 0 rgba(255,255,255,0.2) inset',
              opacity: !selectedTemplate ? 0.5 : 1,
              pointerEvents: !selectedTemplate ? 'none' : 'auto',
            }}
          >
            <SparkleIcon />
            Generate Report
          </motion.button>
        </motion.div>
      </div>

      {/* ─── Loading Overlay ─── */}
      <AnimatePresence>
        {generating && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            style={{
              background: 'linear-gradient(145deg, #c8ddb8 0%, #a8c8a0 25%, #b8d4a8 50%, #c0d8b0 75%, #d0e0c0 100%)',
            }}
          >
            <div className="flex flex-col items-center gap-6">
              {/* Animated logo */}
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Image src={logoBlack} alt="Sylvy" width={48} height={48} className="object-contain" />
              </motion.div>

              {/* Spinner ring */}
              <div className="relative w-10 h-10">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  className="w-10 h-10 rounded-full"
                  style={{
                    border: '2.5px solid rgba(0,0,0,0.06)',
                    borderTopColor: '#4CAF7D',
                  }}
                />
              </div>

              {/* Loading messages */}
              <div className="h-6 relative">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease }}
                    className="text-[14px] text-[#3c3c43] font-medium"
                    style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif" }}
                  >
                    {loadingMessages[loadingStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
