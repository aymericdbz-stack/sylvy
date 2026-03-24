'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

const ease = [0.25, 0.46, 0.45, 0.94] as const

const glass = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(40px) saturate(1.8)',
  WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
  boxShadow:
    '0 0.5px 0 0 rgba(255,255,255,0.6) inset, 0 1px 3px rgba(0,0,0,0.04), 0 8px 28px rgba(0,0,0,0.04)',
  border: '0.5px solid rgba(255,255,255,0.5)',
} as const

/* ─── Project Colors ─── */
const projectColors: Record<string, string> = {
  crispr: '#E88B8B',
  protein: '#6AADD8',
  cell: '#E8B44C',
}

/* ─── Mock ELN entries ─── */
const existingEntries = [
  { id: 1, title: 'Experiment Log — Week 12', date: 'Mar 18, 2026', type: 'log' },
  { id: 2, title: 'Protocol: Buffer Preparation', date: 'Mar 15, 2026', type: 'protocol' },
  { id: 3, title: 'Observation Notes — Run #4', date: 'Mar 12, 2026', type: 'note' },
]

type ReportSection = { title: string; body: string }
type ReportData = { title: string; templateName: string; sections: ReportSection[] }

/* ─── Chart Components (mirrors report page) ─── */
function AssayBarChart() {
  const bars = [
    { label: 'Vehicle', value: 2.15, color: '#b0b0b5' },
    { label: 'Group A', value: 7.42, color: '#4CAF7D' },
    { label: 'Group B', value: 4.87, color: '#6AADD8' },
  ]
  const maxVal = 10
  return (
    <div className="my-6 p-5 rounded-[14px]" style={{ background: 'rgba(0,0,0,0.02)', border: '0.5px solid rgba(0,0,0,0.05)' }}>
      <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">Fig. 1 — Target Protein Concentration (ng/mL)</p>
      <svg viewBox="0 0 400 180" className="w-full" style={{ maxWidth: 460 }}>
        {[0, 2.5, 5, 7.5, 10].map((v, i) => {
          const y = 150 - (v / maxVal) * 130
          return (
            <g key={i}>
              <line x1="50" y1={y} x2="370" y2={y} stroke="#e8e8e8" strokeWidth="0.5" />
              <text x="44" y={y + 4} textAnchor="end" fill="#b0b0b5" fontSize="9" fontFamily="'JetBrains Mono', monospace">{v}</text>
            </g>
          )
        })}
        {bars.map((bar, i) => {
          const barW = 60
          const gap = 30
          const x = 80 + i * (barW + gap)
          const barH = (bar.value / maxVal) * 130
          const y = 150 - barH
          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={barH} rx="4" fill={bar.color} opacity="0.85" />
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill="#2c2c2e" fontSize="10" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
                {bar.value}
              </text>
              <line x1={x + barW / 2} y1={y + 2} x2={x + barW / 2} y2={y - 3} stroke="#2c2c2e" strokeWidth="1" />
              <line x1={x + barW / 2 - 6} y1={y - 3} x2={x + barW / 2 + 6} y2={y - 3} stroke="#2c2c2e" strokeWidth="1" />
              <text x={x + barW / 2} y={165} textAnchor="middle" fill="#8e8e93" fontSize="9" fontFamily="'JetBrains Mono', monospace">{bar.label}</text>
            </g>
          )
        })}
        <line x1="50" y1="150" x2="370" y2="150" stroke="#d0d0d0" strokeWidth="1" />
        <line x1="50" y1="20" x2="50" y2="150" stroke="#d0d0d0" strokeWidth="1" />
      </svg>
      <p className="text-[10px] text-[#b0b0b5] mt-2 italic">Mean ± SEM, n=3. *p &lt; 0.01 vs. vehicle control.</p>
    </div>
  )
}

function ProteinCDChart() {
  const points = [
    [190, -8], [195, -15], [200, -12], [205, -5], [208, -18], [210, -20],
    [215, -16], [220, -19], [222, -18], [225, -12], [230, -6], [235, -3],
    [240, -1], [245, 0], [250, 0.5], [255, 0.3], [260, 0]
  ]
  const xMin = 190, xMax = 260, yMin = -22, yMax = 4
  const toX = (v: number) => 50 + ((v - xMin) / (xMax - xMin)) * 320
  const toY = (v: number) => 150 - ((v - yMin) / (yMax - yMin)) * 130
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p[0])},${toY(p[1])}`).join(' ')

  return (
    <div className="my-6 p-5 rounded-[14px]" style={{ background: 'rgba(0,0,0,0.02)', border: '0.5px solid rgba(0,0,0,0.05)' }}>
      <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">Fig. 1 — CD Spectrum (190–260 nm)</p>
      <svg viewBox="0 0 400 180" className="w-full" style={{ maxWidth: 460 }}>
        {[-20, -15, -10, -5, 0].map((v, i) => {
          const y = toY(v)
          return (
            <g key={i}>
              <line x1="50" y1={y} x2="370" y2={y} stroke="#e8e8e8" strokeWidth="0.5" />
              <text x="44" y={y + 3} textAnchor="end" fill="#b0b0b5" fontSize="8" fontFamily="'JetBrains Mono', monospace">{v}</text>
            </g>
          )
        })}
        {[190, 210, 230, 250, 260].map((v, i) => (
          <text key={i} x={toX(v)} y={165} textAnchor="middle" fill="#b0b0b5" fontSize="8" fontFamily="'JetBrains Mono', monospace">{v}</text>
        ))}
        <path d={pathD} fill="none" stroke="#6AADD8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={toX(208)} cy={toY(-18)} r="3" fill="#6AADD8" />
        <circle cx={toX(222)} cy={toY(-18)} r="3" fill="#6AADD8" />
        <line x1="50" y1="150" x2="370" y2="150" stroke="#d0d0d0" strokeWidth="1" />
        <line x1="50" y1="20" x2="50" y2="150" stroke="#d0d0d0" strokeWidth="1" />
        <text x="210" y="178" textAnchor="middle" fill="#8e8e93" fontSize="9" fontFamily="'JetBrains Mono', monospace">Wavelength (nm)</text>
        <text x="14" y="90" textAnchor="middle" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace" transform="rotate(-90 14 90)">[θ] (mdeg)</text>
      </svg>
      <p className="text-[10px] text-[#b0b0b5] mt-2 italic">Characteristic double minima at 208 and 222 nm indicate α-helical structure.</p>
    </div>
  )
}

function CellViabilityChart() {
  const conditions = [
    { label: 'Lipo3000', efficiency: 78.3, viability: 92, effColor: '#4CAF7D', viabColor: '#8BC5A0' },
    { label: 'PEI', efficiency: 52.1, viability: 78, effColor: '#6AADD8', viabColor: '#A0CBE8' },
    { label: 'CaPO₄', efficiency: 31.4, viability: 82, effColor: '#D4885C', viabColor: '#E8B898' },
  ]
  const maxVal = 100
  return (
    <div className="my-6 p-5 rounded-[14px]" style={{ background: 'rgba(0,0,0,0.02)', border: '0.5px solid rgba(0,0,0,0.05)' }}>
      <p className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.06em] mb-4">Fig. 1 — Transfection Efficiency & Cell Viability (%)</p>
      <svg viewBox="0 0 400 200" className="w-full" style={{ maxWidth: 460 }}>
        {[0, 25, 50, 75, 100].map((v, i) => {
          const y = 160 - (v / maxVal) * 140
          return (
            <g key={i}>
              <line x1="50" y1={y} x2="370" y2={y} stroke="#e8e8e8" strokeWidth="0.5" />
              <text x="44" y={y + 3} textAnchor="end" fill="#b0b0b5" fontSize="9" fontFamily="'JetBrains Mono', monospace">{v}</text>
            </g>
          )
        })}
        {conditions.map((c, i) => {
          const groupW = 80
          const gap = 20
          const groupX = 70 + i * (groupW + gap)
          const barW = 30
          const effH = (c.efficiency / maxVal) * 140
          const viabH = (c.viability / maxVal) * 140
          return (
            <g key={i}>
              <rect x={groupX} y={160 - effH} width={barW} height={effH} rx="3" fill={c.effColor} opacity="0.85" />
              <text x={groupX + barW / 2} y={160 - effH - 5} textAnchor="middle" fill="#2c2c2e" fontSize="9" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
                {c.efficiency}%
              </text>
              <rect x={groupX + barW + 4} y={160 - viabH} width={barW} height={viabH} rx="3" fill={c.viabColor} opacity="0.7" />
              <text x={groupX + barW + 4 + barW / 2} y={160 - viabH - 5} textAnchor="middle" fill="#2c2c2e" fontSize="9" fontWeight="600" fontFamily="'JetBrains Mono', monospace">
                {c.viability}%
              </text>
              <text x={groupX + barW + 2} y={176} textAnchor="middle" fill="#8e8e93" fontSize="9" fontFamily="'JetBrains Mono', monospace">{c.label}</text>
            </g>
          )
        })}
        <line x1="50" y1="160" x2="370" y2="160" stroke="#d0d0d0" strokeWidth="1" />
        <line x1="50" y1="20" x2="50" y2="160" stroke="#d0d0d0" strokeWidth="1" />
        <rect x="280" y="6" width="10" height="10" rx="2" fill="#4CAF7D" opacity="0.85" />
        <text x="294" y="14" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace">Efficiency</text>
        <rect x="280" y="20" width="10" height="10" rx="2" fill="#8BC5A0" opacity="0.7" />
        <text x="294" y="28" fill="#8e8e93" fontSize="8" fontFamily="'JetBrains Mono', monospace">Viability</text>
      </svg>
      <p className="text-[10px] text-[#b0b0b5] mt-2 italic">GFP+ cells measured by flow cytometry at 48h. Viability by trypan blue exclusion.</p>
    </div>
  )
}

/* ─── Chart mapping by template + section title ─── */
const sectionCharts: Record<string, Record<string, React.FC>> = {
  assay: { Results: AssayBarChart },
  protein: { Results: ProteinCDChart },
  cell: { Results: CellViabilityChart },
}

/* ─── Default reports (full content, same as report page) ─── */
const defaultReports: Record<string, ReportData> = {
  assay: {
    title: 'Standard Assay Report',
    templateName: 'Standard assay report',
    sections: [
      {
        title: 'Tags',
        body: '#ELISA, #Immunoassay, #ProteinQuantification, #96well, #HRP, #TMB, #DoseResponse',
      },
      {
        title: 'Abstract',
        body: 'This report presents the results of a standardized enzyme-linked immunosorbent assay (ELISA) performed to quantify target protein concentrations across experimental and control conditions. The assay was conducted following validated SOPs with appropriate positive and negative controls. Preliminary findings indicate a statistically significant increase in target expression under treatment conditions (p < 0.01), consistent with the proposed mechanism of action.',
      },
      {
        title: 'Methods',
        body: 'Samples were prepared in triplicate using a 96-well microplate format. Capture antibody was coated at 2 \u00b5g/mL in carbonate buffer (pH 9.6) overnight at 4\u00b0C. After blocking with 3% BSA in PBS-T for 1 hour at room temperature, serial dilutions of the standard curve (0\u201310 ng/mL) and experimental samples were added and incubated for 2 hours. Detection antibody (HRP-conjugated, 1:5000) was applied for 1 hour, followed by TMB substrate development. Absorbance was measured at 450 nm using a BioTek Synergy H1 plate reader. Data were analyzed using a four-parameter logistic regression model.',
      },
      {
        title: 'Results',
        body: 'The standard curve demonstrated excellent linearity (R\u00b2 = 0.998) across the working range. Treatment group A showed a mean concentration of 7.42 \u00b1 0.38 ng/mL compared to the vehicle control at 2.15 \u00b1 0.22 ng/mL, representing a 3.45-fold increase. Treatment group B yielded intermediate values of 4.87 \u00b1 0.41 ng/mL. Inter-assay coefficient of variation was below 8% across all conditions. No significant matrix effects were observed in spike-recovery experiments (recovery range: 94\u2013107%).',
      },
      {
        title: 'Discussion',
        body: 'The dose-dependent increase in target protein expression aligns with previous findings reported by Chen et al. (2024) and supports the hypothesis that the compound activates the upstream signaling cascade. The robust assay performance, as evidenced by low CVs and high recovery rates, validates the reliability of these measurements. The intermediate response observed in group B suggests a potential threshold effect that warrants further investigation with additional dose levels. Limitations include the single time-point measurement, which does not capture temporal dynamics of protein expression.',
      },
      {
        title: 'Conclusion',
        body: 'The ELISA results confirm a significant and reproducible upregulation of target protein under treatment conditions. These findings support advancement to the next phase of investigation, including time-course studies and evaluation of downstream functional effects. The assay protocol demonstrated sufficient sensitivity and reproducibility for continued use in subsequent experiments.',
      },
    ],
  },
  protein: {
    title: 'Protein Analysis Report',
    templateName: 'Protein analysis report',
    sections: [
      {
        title: 'Tags',
        body: '#ProteinPurification, #SDSPAGE, #Chromatography, #CDSpectroscopy, #DSF, #MALDITOF, #RecombinantExpression',
      },
      {
        title: 'Abstract',
        body: 'This report details the structural and functional characterization of recombinant protein PDB 1AON, expressed in E. coli BL21(DE3) and purified using a combination of affinity chromatography and size-exclusion chromatography. The purified protein showed >95% purity by SDS-PAGE and maintained expected oligomeric state as confirmed by native PAGE and dynamic light scattering.',
      },
      {
        title: 'Sample Preparation',
        body: 'The gene encoding the target protein was cloned into pET-28a vector with an N-terminal His6 tag. Expression was induced with 0.5 mM IPTG at OD600 = 0.6 and continued for 16 hours at 18\u00b0C. Cell pellets were resuspended in lysis buffer (50 mM Tris-HCl pH 8.0, 300 mM NaCl, 10 mM imidazole, 1 mM PMSF) and lysed by sonication. Clarified lysate was loaded onto a Ni-NTA column, washed with 30 mM imidazole, and eluted with 250 mM imidazole. Fractions were pooled, concentrated, and further purified by SEC using a Superdex 200 Increase 10/300 GL column.',
      },
      {
        title: 'Analysis Methods',
        body: 'SDS-PAGE was performed on 12% polyacrylamide gels with Coomassie Blue staining. Western blot analysis used anti-His antibody (1:10000, Sigma). Protein concentration was determined by Bradford assay. Secondary structure was assessed by circular dichroism spectroscopy (190\u2013260 nm) using a Jasco J-815 spectropolarimeter. Thermal stability was evaluated by differential scanning fluorimetry (DSF) with SYPRO Orange dye. Mass spectrometry (MALDI-TOF) confirmed the molecular weight within 0.1% of predicted mass.',
      },
      {
        title: 'Results',
        body: 'The final yield was 12.4 mg of purified protein per liter of culture. SDS-PAGE showed a single band at the expected molecular weight of 57.3 kDa with >95% purity. CD spectra indicated a predominantly alpha-helical secondary structure (38% \u03b1-helix, 18% \u03b2-sheet), consistent with the known crystal structure. The melting temperature was determined to be 52.4 \u00b1 0.8\u00b0C by DSF. SEC elution profile showed a single symmetric peak at the expected elution volume for a tetrameric assembly.',
      },
      {
        title: 'Discussion',
        body: 'The recombinant protein was successfully expressed and purified with high yield and purity. The biophysical characterization confirms that the protein adopts its native fold and oligomeric state, making it suitable for downstream structural studies and functional assays. The thermal stability is comparable to published data for the wild-type protein, suggesting that the His-tag does not significantly perturb protein stability.',
      },
      {
        title: 'Conclusion',
        body: 'High-quality recombinant protein has been produced with sufficient yield for planned crystallography trials and binding assays. The protein preparation meets all quality criteria for downstream applications. Next steps include crystallization screening and isothermal titration calorimetry with candidate ligands.',
      },
    ],
  },
  cell: {
    title: 'Cell Experiment Report',
    templateName: 'Cell experiment report',
    sections: [
      {
        title: 'Tags',
        body: '#HEK293T, #Transfection, #Lipofectamine, #PEI, #GFP, #FlowCytometry, #CellViability',
      },
      {
        title: 'Abstract',
        body: 'This report describes the results of a cell-based transfection experiment using HEK 293T cells to evaluate the expression efficiency of a GFP-tagged construct under different transfection reagent conditions. Lipofectamine 3000 yielded the highest transfection efficiency (78.3 \u00b1 4.2%) with minimal cytotoxicity, while PEI-based transfection showed moderate efficiency (52.1 \u00b1 6.8%) with higher cell death.',
      },
      {
        title: 'Cell Culture',
        body: 'HEK 293T cells (ATCC CRL-3216, passage 18) were maintained in DMEM supplemented with 10% FBS, 1% penicillin-streptomycin, and 2 mM L-glutamine at 37\u00b0C in a humidified atmosphere of 5% CO2. Cells were seeded at 2.5 \u00d7 10\u2075 cells/well in 6-well plates 24 hours prior to transfection. At the time of transfection, cells were approximately 70\u201380% confluent with >95% viability as assessed by trypan blue exclusion.',
      },
      {
        title: 'Treatment Protocol',
        body: 'Three transfection conditions were tested: (1) Lipofectamine 3000 at manufacturer-recommended ratios (3 \u00b5L per \u00b5g DNA), (2) linear PEI 25 kDa at a 3:1 N/P ratio, and (3) calcium phosphate precipitation. Each condition used 2.5 \u00b5g of pEGFP-N1 plasmid per well. OptiMEM was used as the transfection medium for conditions 1 and 2. Cells were incubated with transfection complexes for 6 hours before medium replacement. GFP expression was assessed at 24 and 48 hours post-transfection.',
      },
      {
        title: 'Results',
        body: 'Flow cytometry analysis at 48 hours revealed that Lipofectamine 3000 achieved 78.3 \u00b1 4.2% GFP-positive cells with a median fluorescence intensity (MFI) of 12,450 AU. PEI transfection yielded 52.1 \u00b1 6.8% positive cells (MFI: 8,230 AU), while calcium phosphate showed 31.4 \u00b1 8.1% efficiency (MFI: 5,890 AU). Cell viability remained above 90% for Lipofectamine, but decreased to 78% and 82% for PEI and calcium phosphate conditions, respectively. Fluorescence microscopy at 24 hours confirmed uniform GFP distribution across the cytoplasm and nucleus.',
      },
      {
        title: 'Discussion',
        body: 'Lipofectamine 3000 demonstrated superior performance for transient transfection of HEK 293T cells, consistent with published benchmarks for this cell line. The lower efficiency of PEI may be attributed to suboptimal N/P ratio or polymer batch variability. Calcium phosphate, while the most cost-effective method, showed the highest variability, likely due to pH sensitivity during precipitate formation. The high viability across all conditions suggests that the DNA amounts used were within tolerable ranges for this cell type.',
      },
      {
        title: 'Conclusion',
        body: 'Lipofectamine 3000 is recommended as the primary transfection reagent for subsequent experiments requiring high-efficiency transient expression in HEK 293T cells. Future work should include optimization of PEI ratios and evaluation of stable selection protocols. A follow-up experiment with the full-length construct (replacing GFP reporter) is planned for the next cycle.',
      },
    ],
  },
}

function ExperimentsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const projectId = searchParams.get('project')
  const addedType = searchParams.get('added')
  const projectName = searchParams.get('name')
  const reportTitle = searchParams.get('reportTitle')
  const accentColor = projectColors[projectId || ''] || '#4CAF7D'

  const [showToast, setShowToast] = useState(false)
  const [reportOpen, setReportOpen] = useState(true)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [reportSigned, setReportSigned] = useState(false)
  const [signing, setSigning] = useState(false)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const templateIdRef = useRef<string>('assay')

  // Load report from localStorage (fallback to defaults)
  useEffect(() => {
    if (addedType === 'report') {
      const templateId = localStorage.getItem('sylvy-demo-current-template') || 'assay'
      templateIdRef.current = templateId
      const storageKey = `sylvy-demo-report-${templateId}`
      const saved = localStorage.getItem(storageKey)
      if (saved) {
        try {
          setReportData(JSON.parse(saved))
          return
        } catch { /* fall through to default */ }
      }
      // Fallback: use default report for this template
      setReportData(defaultReports[templateId] || defaultReports.assay)
    }
  }, [addedType])

  // Persist report edits to localStorage (debounced)
  const persistReport = useCallback((updated: ReportData) => {
    setReportData(updated)
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      const templateId = localStorage.getItem('sylvy-demo-current-template') || 'assay'
      localStorage.setItem(`sylvy-demo-report-${templateId}`, JSON.stringify(updated))
    }, 600)
  }, [])

  const updateReportTitle = useCallback((newTitle: string) => {
    if (!reportData) return
    persistReport({ ...reportData, title: newTitle })
  }, [reportData, persistReport])

  const updateReportSection = useCallback((index: number, field: 'title' | 'body', value: string) => {
    if (!reportData) return
    const newSections = [...reportData.sections]
    newSections[index] = { ...newSections[index], [field]: value }
    persistReport({ ...reportData, sections: newSections })
  }, [reportData, persistReport])

  useEffect(() => {
    if (addedType === 'report') {
      // Brief delay for the page to render, then show toast
      const t = setTimeout(() => setShowToast(true), 400)
      return () => clearTimeout(t)
    }
  }, [addedType])

  // Auto-hide toast
  useEffect(() => {
    if (showToast) {
      const t = setTimeout(() => setShowToast(false), 4000)
      return () => clearTimeout(t)
    }
  }, [showToast])

  return (
    <div
      className="min-h-screen w-full relative"
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
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(200, 221, 184, 0.8)',
          backdropFilter: 'blur(30px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(30px) saturate(1.6)',
          borderBottom: '0.5px solid rgba(255,255,255,0.3)',
        }}
      >
        <div className="mx-auto max-w-[1000px] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => router.push(addedType ? '/demo' : '/demo/projects')}
              whileHover={{ scale: 1.05, x: -2 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center w-[32px] h-[32px] rounded-[10px] cursor-pointer transition-colors hover:bg-black/[0.04]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d1d1f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </motion.button>
            <Image src={logoBlack} alt="Sylvy" width={24} height={24} className="object-contain cursor-pointer" onClick={() => router.push('/demo')} />
            {projectName && (
              <div className="flex items-center gap-2">
                <div className="w-[8px] h-[8px] rounded-full" style={{ background: accentColor }} />
                <span className="text-[13px] font-medium text-[#1d1d1f]">{projectName}</span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ─── Content ─── */}
      <div className="mx-auto max-w-[1000px] px-6 py-8 md:py-12">
        {/* ─── Entries List ─── */}
        <div className="space-y-3">
          {/* Newly added report — highlighted */}
          {addedType === 'report' && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease }}
              className="rounded-[16px] relative overflow-hidden"
              style={{
                ...glass,
                background: 'rgba(255, 255, 255, 0.88)',
                border: `1px solid ${accentColor}30`,
              }}
            >
              <div className="absolute top-0 left-0 w-[3px] h-full rounded-full" style={{ background: accentColor }} />

              {/* Header row — clickable toggle */}
              <motion.div
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.01)' }}
                onClick={() => setReportOpen(!reportOpen)}
                className="p-5 flex items-start justify-between ml-2 cursor-pointer select-none"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                      style={{ background: `${accentColor}15`, color: accentColor }}
                    >
                      Report
                    </span>
                    <span
                      className="text-[10px] font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
                      style={{ background: '#4CAF7D15', color: '#4CAF7D' }}
                    >
                      Just added
                    </span>
                  </div>
                  <h3
                    className="text-[14px] font-semibold text-[#1d1d1f] mt-1.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {reportTitle || 'Generated Lab Report'}
                  </h3>
                  <p className="text-[11px] text-[#8e8e93] mt-1">
                    Added on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} — Generated by Sylvy
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: reportOpen ? 90 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-1 flex-shrink-0"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b5" strokeWidth="2" strokeLinecap="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </motion.div>
              </motion.div>

              {/* Expanded report content — editable */}
              <AnimatePresence>
                {reportOpen && reportData && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease }}
                    style={{ transformOrigin: 'top' }}
                    className="overflow-hidden"
                  >
                    <div
                      className="mx-5 mb-5 rounded-[14px] px-8 md:px-12 py-8 md:py-10"
                      style={{
                        background: 'rgba(255,255,255,0.95)',
                        border: '0.5px solid rgba(0,0,0,0.05)',
                        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', ui-monospace, monospace",
                      }}
                    >
                      {/* Editable report title */}
                      <input
                        value={reportData.title}
                        onChange={(e) => updateReportTitle(e.target.value)}
                        className="w-full text-[18px] font-bold text-[#1d1d1f] tracking-[-0.01em] uppercase bg-transparent outline-none border-none leading-tight mb-1"
                        style={{ fontFamily: 'inherit' }}
                        spellCheck={false}
                      />
                      <p className="text-[10px] text-[#8e8e93] mb-6 pb-3" style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                        {reportData.templateName} — Generated on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>

                      {/* Editable sections */}
                      {reportData.sections.map((section, i) => (
                        <div key={i} className="mb-6">
                          <div className="flex items-baseline gap-0 mb-1">
                            <span className="text-[12px] font-bold text-[#4CAF7D] uppercase tracking-[0.04em] flex-shrink-0 select-none">
                              {i + 1}.{' '}
                            </span>
                            <input
                              value={section.title}
                              onChange={(e) => updateReportSection(i, 'title', e.target.value)}
                              className="text-[12px] font-bold text-[#1d1d1f] bg-transparent outline-none border-none w-full uppercase tracking-[0.04em]"
                              style={{ fontFamily: 'inherit' }}
                              spellCheck={false}
                            />
                          </div>
                          <textarea
                            value={section.body}
                            onChange={(e) => {
                              updateReportSection(i, 'body', e.target.value)
                              const el = e.target
                              el.style.height = 'auto'
                              el.style.height = el.scrollHeight + 'px'
                            }}
                            ref={(el) => {
                              if (el) {
                                el.style.height = 'auto'
                                el.style.height = el.scrollHeight + 'px'
                              }
                            }}
                            className="w-full text-[12px] text-[#2c2c2e] leading-[1.8] bg-transparent outline-none resize-none rounded-[6px] px-0 py-1 transition-colors duration-150 hover:bg-black/[0.01] focus:bg-black/[0.015]"
                            style={{ fontFamily: 'inherit' }}
                            spellCheck={false}
                          />
                          {/* Chart if available for this section */}
                          {(() => {
                            const ChartComp = sectionCharts[templateIdRef.current]?.[section.title]
                            return ChartComp ? <ChartComp /> : null
                          })()}
                        </div>
                      ))}

                      {/* Sign Report button */}
                      <div className="mt-8 pt-6 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                        <div>
                          {reportSigned && (
                            <motion.div
                              initial={{ opacity: 0, y: 4 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex items-center gap-2"
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              <span className="text-[11px] text-[#4CAF7D] font-medium">
                                Signed on {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                              </span>
                            </motion.div>
                          )}
                        </div>
                        <motion.button
                          whileHover={!reportSigned ? { scale: 1.03, y: -1 } : {}}
                          whileTap={!reportSigned ? { scale: 0.97 } : {}}
                          onClick={() => {
                            if (reportSigned) return
                            setSigning(true)
                            setTimeout(() => {
                              setSigning(false)
                              setReportSigned(true)
                            }, 1000)
                          }}
                          disabled={reportSigned || signing}
                          className="flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[12px] font-semibold cursor-pointer transition-all"
                          style={{
                            background: reportSigned ? 'rgba(76,175,125,0.1)' : 'linear-gradient(135deg, #1d1d1f 0%, #3a3a3c 100%)',
                            color: reportSigned ? '#4CAF7D' : '#fff',
                            boxShadow: reportSigned ? 'none' : '0 2px 8px rgba(0,0,0,0.15)',
                            opacity: signing ? 0.7 : 1,
                          }}
                        >
                          {signing ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                className="w-[12px] h-[12px] border-[1.5px] border-white/40 border-t-white rounded-full"
                              />
                              Signing...
                            </>
                          ) : reportSigned ? (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                              Signed
                            </>
                          ) : (
                            <>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                              </svg>
                              Sign Report
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Existing entries */}
          {existingEntries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.08, ease }}
              className="rounded-[16px] p-5 cursor-pointer transition-all hover:shadow-md"
              style={glass}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#8e8e93] px-2 py-0.5 rounded-full bg-black/[0.03]">
                    {entry.type}
                  </span>
                  <h3
                    className="text-[14px] font-medium text-[#1d1d1f] mt-1.5"
                    style={{ fontFamily: "'JetBrains Mono', monospace" }}
                  >
                    {entry.title}
                  </h3>
                  <p className="text-[11px] text-[#8e8e93] mt-1">{entry.date}</p>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b0b0b5" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="h-16" />
      </div>

      {/* ─── Success Toast ─── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 10, x: '-50%' }}
            transition={{ duration: 0.35, ease }}
            className="fixed bottom-8 left-1/2 z-50 flex items-center gap-2.5 rounded-[14px] px-5 py-3"
            style={{
              background: 'rgba(255,255,255,0.92)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 12px 40px rgba(0,0,0,0.06)',
              border: '0.5px solid rgba(255,255,255,0.8)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
            }}
          >
            <div className="w-[20px] h-[20px] rounded-full flex items-center justify-center" style={{ background: '#4CAF7D15' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4CAF7D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-[13px] font-medium text-[#1d1d1f]">Report added to project</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function ExperimentsPage() {
  return (
    <Suspense>
      <ExperimentsContent />
    </Suspense>
  )
}
