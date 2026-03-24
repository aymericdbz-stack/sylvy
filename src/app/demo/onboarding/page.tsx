'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import logoBlack from '../../../../logo/Logo Noir sans Fond.webp'

/* ─── Types ─── */
type Step = 'auth' | 'connectors' | 'importing' | 'success'
type ConnectorId = 'gdrive' | 'sharepoint' | 'notion' | 'dropbox' | 'onedrive'

/* ─── Connector Data ─── */
const CONNECTORS: { id: ConnectorId; name: string; color: string; icon: React.ReactNode }[] = [
  {
    id: 'gdrive',
    name: 'Google Drive',
    color: '#4285F4',
    icon: (
      <svg width="28" height="28" viewBox="0 0 1443 1250">
        <path d="M240.525 1249.993l240.492-416.664h962.044l-240.514 416.664z" fill="#3777E3" />
        <path d="M962.055 833.329h481.006L962.055 0H481.017z" fill="#FFCF63" />
        <path d="M0 833.329l240.525 416.664 481.006-833.328L481.017 0z" fill="#11A861" />
      </svg>
    ),
  },
  {
    id: 'sharepoint',
    name: 'SharePoint',
    color: '#038387',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 28">
        <circle cx="17" cy="8" r="7.5" fill="#036C70" />
        <circle cx="19" cy="19" r="6" fill="#1A9BA1" />
        <circle cx="11" cy="17" r="5" fill="#37C6D0" />
        <rect x="1" y="5" width="14" height="14" rx="2" fill="#038387" />
        <text x="8" y="16" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold" fontFamily="Arial, sans-serif">S</text>
      </svg>
    ),
  },
  {
    id: 'notion',
    name: 'Notion',
    color: '#000000',
    icon: (
      <svg width="28" height="28" viewBox="0 0 100 100" fill="none">
        <path d="M6.017 4.313l55.333-4.087c6.797-.583 8.543-.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277-1.553 6.807-6.99 7.193L24.467 99.967c-4.08.193-6.023-.387-8.16-3.107L3.3 79.94c-2.333-3.3-3.3-5.827-3.3-8.743V11.313c0-3.88 1.553-6.42 6.017-7z" fill="#000" />
        <path d="M61.35 0.227l-55.333 4.087C1.553 4.893 0 7.433 0 11.313v59.887c0 2.917.967 5.443 3.3 8.743l12.007 16.92c2.137 2.72 4.08 3.3 8.16 3.107l64.257-3.89c5.433-.387 6.99-2.917 6.99-7.193V20.64c0-2.21-.853-2.82-3.413-4.67l-.47-.383-17.663-12.443c-4.277-3.107-6.02-3.5-12.817-2.917zM25.92 19.523c-5.247.353-6.437.433-9.417-1.99L8.927 11.507c-.78-.78-.39-1.753 1.163-1.94l52.773-3.887c4.467-.39 6.793 1.167 8.543 2.527l9.72 6.99c.39.197.973 1.36-.193 1.36l-54.627 3.16-.387-.193zM19.803 88.3V30.367c0-2.53.78-3.697 3.107-3.893L86.047 23c2.14-.193 3.107 1.167 3.107 3.693v57.547c0 2.53-1.36 4.473-4.277 4.667l-58.63 3.497c-2.917.193-4.443-1.167-4.443-4.1v-.003zM77.7 35.207c.39 1.75 0 3.5-1.75 3.697l-2.917.58v42.767c-2.527 1.36-4.853 2.137-6.797 2.137-3.107 0-3.883-.973-6.21-3.887L42.14 51.96v26.04l6.017 1.36s0 3.5-4.853 3.5l-13.39.78c-.39-.78 0-2.723 1.36-3.107l3.497-.973V43.767l-4.853-.39c-.39-1.75.583-4.277 3.3-4.467l14.363-.97 18.313 28.17V41.667l-5.053-.583c-.39-2.143 1.163-3.7 3.103-3.89l13.577-.987z" fill="#fff" />
      </svg>
    ),
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    color: '#0061FF',
    icon: (
      <svg width="28" height="28" viewBox="0 0 43 40" fill="none">
        <path d="M12.6 1.6L0 9.2l10.5 8.4L22.8 9.2z" fill="#007EE5" />
        <path d="M0 26l12.6 7.6L22.8 25.2 10.5 17.6z" fill="#007EE5" />
        <path d="M22.8 25.2l10.2 8.4L45.6 26 33.1 17.6z" fill="#007EE5" />
        <path d="M45.6 9.2L33 1.6 22.8 9.2l12.5 8.4z" fill="#007EE5" />
        <path d="M22.8 27.2l-10.2 8.4-2.1-1.4v1.6l12.3 7.4 12.3-7.4v-1.6l-2.1 1.4z" fill="#007EE5" />
      </svg>
    ),
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    color: '#0078D4',
    icon: (
      <svg width="28" height="28" viewBox="0 0 28 18">
        <path d="M17.5 3.5C15.6 3.5 13.9 4.4 12.8 5.8C12 5.3 11 5 10 5C7 5 4.5 7.3 4.3 10.2C1.8 10.8 0 13 0 15.5C0 18.5 2.5 21 5.5 21H11L22 13L17.5 3.5z" fill="#0364B8" />
        <path d="M12.8 5.8C13.3 5.1 14 4.5 14.7 4.1C15.5 3.7 16.5 3.5 17.5 3.5L22 13L11 21H17.5H22.5C25.5 21 28 18.5 28 15.5C28 12.5 25.8 10 23 9.6C23 9.4 23 9.2 23 9C23 5.7 20.6 3 17.5 3C16.2 3 15 3.4 14 4.1L12.8 5.8z" fill="#0078D4" />
        <path d="M4.3 10.2C4.5 7.3 7 5 10 5C11 5 12 5.3 12.8 5.8L11 21H5.5C2.5 21 0 18.5 0 15.5C0 13 1.8 10.8 4.3 10.2z" fill="#1490DF" />
        <path d="M12.8 5.8L11 21H22L23 9.6C23 9.4 23 9.2 23 9C23 5.7 20.6 3 17.5 3C16.2 3 15 3.4 14 4.1C13.5 4.5 13.1 5.1 12.8 5.8z" fill="#28A8EA" fillOpacity={0} />
        <path d="M11 21L22 13L23 9.6C25.8 10 28 12.5 28 15.5C28 18.5 25.5 21 22.5 21H11z" fill="#28A8EA" />
      </svg>
    ),
  },
]

/* ─── Import Status Messages ─── */
const IMPORT_MESSAGES = [
  'Connecting to Google Drive…',
  'Scanning folders and documents…',
  'Identifying protocols and experiments…',
  'Structuring projects and sources…',
  'Populating your workspace…',
]

/* ─── Shared Styles ─── */
const BG_GRADIENT = 'linear-gradient(160deg, #c8ddb8 0%, #b8cfaa 30%, #c2d6b2 60%, #ccdcbc 100%)'

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.88)',
  backdropFilter: 'blur(30px)',
  WebkitBackdropFilter: 'blur(30px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 8px 32px rgba(0,0,0,0.06)',
  border: '0.5px solid rgba(255,255,255,0.7)',
} as const

/* ─── Animation Variants ─── */
const EASE = [0.25, 0.46, 0.45, 0.94] as const

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE as unknown as [number, number, number, number] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3, ease: EASE as unknown as [number, number, number, number] } },
}

/* ─── Fingerprint SVG ─── */
const FingerprintIcon = ({ size = 48, color = '#999' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4" />
    <path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6 3 0 5.5 2 6 5" />
    <path d="M12 12v7.5" />
    <path d="M8 15c0-2 1.5-3 4-3" />
    <path d="M16 13c0 3.5-1 7-3 9" />
    <path d="M20 16c-1 1.5-2.5 3.5-4 5" />
    <path d="M2 16l1 .5" />
    <path d="M6 20c1-1 2-2 2.5-3.5" />
  </svg>
)

/* ─── Import Summary Data ─── */
const IMPORT_SUMMARY = [
  { label: 'projects created', count: 3, icon: '📁' },
  { label: 'documents imported', count: 18, icon: '📄' },
  { label: 'protocols detected', count: 6, icon: '🧬' },
  { label: 'reports structured', count: 4, icon: '📊' },
]

/* ═══════════════════════════════════════════════
   MAIN ONBOARDING COMPONENT
   ═══════════════════════════════════════════════ */
export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('auth')

  /* Auth state */
  const [authState, setAuthState] = useState<'idle' | 'scanning' | 'confirmed'>('idle')

  /* Connector state */
  const [selected, setSelected] = useState<Set<ConnectorId>>(new Set())

  /* Import state */
  const [importStep, setImportStep] = useState(0)
  const [importCount, setImportCount] = useState(0)

  /* ─── Auth Flow ─── */
  const handleAuth = useCallback(() => {
    if (authState !== 'idle') return
    setAuthState('scanning')
    setTimeout(() => {
      setAuthState('confirmed')
      setTimeout(() => setStep('connectors'), 800)
    }, 1800)
  }, [authState])

  /* ─── Connector Toggle ─── */
  const toggleConnector = useCallback((id: ConnectorId) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  /* ─── Import Flow ─── */
  const startImport = useCallback(() => {
    setStep('importing')
    setImportStep(0)
    setImportCount(0)
  }, [])

  useEffect(() => {
    if (step !== 'importing') return
    if (importStep >= IMPORT_MESSAGES.length) {
      setTimeout(() => setStep('success'), 600)
      return
    }
    const delay = importStep === 0 ? 600 : 700 + Math.random() * 400
    const timer = setTimeout(() => {
      setImportStep(s => s + 1)
      setImportCount(c => c + Math.floor(3 + Math.random() * 5))
    }, delay)
    return () => clearTimeout(timer)
  }, [step, importStep])

  /* ─── Enter Workspace ─── */
  const enterWorkspace = useCallback(() => {
    router.push('/demo')
  }, [router])

  return (
    <div
      style={{
        background: BG_GRADIENT,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* ─── Progress Dots ─── */}
      <div style={{ position: 'fixed', top: 32, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 8, zIndex: 50 }}>
        {(['auth', 'connectors', 'importing', 'success'] as Step[]).map((s, i) => (
          <motion.div
            key={s}
            style={{
              width: step === s ? 24 : 6,
              height: 6,
              borderRadius: 3,
              background: step === s ? 'rgba(0,0,0,0.45)' : i <= ['auth', 'connectors', 'importing', 'success'].indexOf(step) ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.12)',
            }}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
        ))}
      </div>

      {/* ─── Steps ─── */}
      <AnimatePresence mode="wait">
        {step === 'auth' && <AuthStep key="auth" authState={authState} onAuth={handleAuth} />}
        {step === 'connectors' && (
          <ConnectorsStep
            key="connectors"
            selected={selected}
            onToggle={toggleConnector}
            onImport={startImport}
          />
        )}
        {step === 'importing' && (
          <ImportingStep key="importing" currentStep={importStep} itemCount={importCount} selected={selected} />
        )}
        {step === 'success' && <SuccessStep key="success" onEnter={enterWorkspace} />}
      </AnimatePresence>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 1 — AUTHENTICATION
   ═══════════════════════════════════════════════ */
function AuthStep({
  authState,
  onAuth,
}: {
  authState: 'idle' | 'scanning' | 'confirmed'
  onAuth: () => void
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 440, padding: '0 24px' }}
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{ marginBottom: 12 }}
      >
        <Image src={logoBlack} alt="Sylvy" width={56} height={56} style={{ objectFit: 'contain' }} />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: '#1a1a1a',
          letterSpacing: '-0.02em',
          margin: '0 0 6px',
        }}
      >
        Welcome to Sylvy
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          fontSize: 15,
          color: '#6b6b6b',
          margin: '0 0 32px',
          letterSpacing: '-0.01em',
        }}
      >
        Your AI-native lab workspace
      </motion.p>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          ...cardStyle,
          borderRadius: 20,
          padding: '36px 32px 32px',
          width: '100%',
          textAlign: 'center',
        }}
      >
        {/* User Identity */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c8ddb8, #a3c48e)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
              fontSize: 18,
              fontWeight: 600,
              color: '#3a6b3a',
              letterSpacing: '-0.02em',
            }}
          >
            CD
          </div>
          <p style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a', margin: '0 0 3px', letterSpacing: '-0.01em' }}>
            Clément Djezvedjian
          </p>
          <p style={{ fontSize: 13, color: '#999', margin: 0, letterSpacing: '-0.005em' }}>
            clement@sylvy.co
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(0,0,0,0.06)', margin: '0 -8px 28px', borderRadius: 1 }} />

        {/* Touch ID Button */}
        <motion.button
          onClick={onAuth}
          disabled={authState !== 'idle'}
          whileHover={authState === 'idle' ? { scale: 1.02 } : {}}
          whileTap={authState === 'idle' ? { scale: 0.98 } : {}}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 14,
            width: '100%',
            padding: '20px 16px',
            border: 'none',
            borderRadius: 14,
            background: authState === 'confirmed' ? 'rgba(76, 175, 125, 0.08)' : 'rgba(0,0,0,0.025)',
            cursor: authState === 'idle' ? 'pointer' : 'default',
            transition: 'background 0.3s ease',
          }}
        >
          {/* Fingerprint Circle */}
          <div style={{ position: 'relative', width: 72, height: 72 }}>
            {/* Pulse ring */}
            {authState === 'scanning' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0.6 }}
                animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute',
                  inset: -8,
                  borderRadius: '50%',
                  border: '2px solid rgba(76, 175, 125, 0.3)',
                }}
              />
            )}
            {/* Success ring */}
            {authState === 'confirmed' && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  border: '2px solid rgba(76, 175, 125, 0.5)',
                }}
              />
            )}
            {/* Circle background */}
            <motion.div
              animate={{
                background: authState === 'confirmed'
                  ? 'rgba(76, 175, 125, 0.1)'
                  : authState === 'scanning'
                    ? 'rgba(76, 175, 125, 0.06)'
                    : 'rgba(0,0,0,0.03)',
              }}
              transition={{ duration: 0.4 }}
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {authState === 'confirmed' ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}>
                  <CheckIcon size={28} color="#4CAF7D" />
                </motion.div>
              ) : (
                <motion.div
                  animate={authState === 'scanning' ? { opacity: [0.6, 1, 0.6] } : { opacity: 1 }}
                  transition={authState === 'scanning' ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  <FingerprintIcon
                    size={32}
                    color={authState === 'scanning' ? '#4CAF7D' : '#999'}
                  />
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Label */}
          <motion.span
            key={authState}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: authState === 'confirmed' ? '#4CAF7D' : authState === 'scanning' ? '#6b6b6b' : '#1a1a1a',
              letterSpacing: '-0.01em',
            }}
          >
            {authState === 'idle' && 'Authenticate with Touch ID'}
            {authState === 'scanning' && 'Authenticating…'}
            {authState === 'confirmed' && 'Identity confirmed'}
          </motion.span>
        </motion.button>
      </motion.div>

      {/* Demo note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        style={{ fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: 20, letterSpacing: '0.01em' }}
      >
        Demo authentication only
      </motion.p>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 2 — CONNECTORS
   ═══════════════════════════════════════════════ */
function ConnectorsStep({
  selected,
  onToggle,
  onImport,
}: {
  selected: Set<ConnectorId>
  onToggle: (id: ConnectorId) => void
  onImport: () => void
}) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 520, padding: '0 24px' }}
    >
      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{ fontSize: 26, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 8px', textAlign: 'center' }}
      >
        Import your existing lab knowledge
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        style={{ fontSize: 14, color: '#6b6b6b', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.5, maxWidth: 400 }}
      >
        Connect your sources to automatically populate your workspace with protocols, reports, and project documents.
      </motion.p>

      {/* Connector Grid */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        style={{
          ...cardStyle,
          borderRadius: 20,
          padding: '28px 24px',
          width: '100%',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginBottom: 8 }}>
          {CONNECTORS.map((c, i) => {
            const isSelected = selected.has(c.id)
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.06, duration: 0.4 }}
                onClick={() => onToggle(c.id)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 10,
                  padding: '20px 12px',
                  borderRadius: 14,
                  border: isSelected ? `1.5px solid ${c.color}30` : '1.5px solid rgba(0,0,0,0.05)',
                  background: isSelected ? `${c.color}08` : 'rgba(0,0,0,0.015)',
                  cursor: 'pointer',
                  transition: 'all 0.25s ease',
                  position: 'relative',
                  width: 'calc(33.33% - 8px)',
                  minWidth: 120,
                }}
              >
                {/* Selection indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 18,
                      height: 18,
                      borderRadius: '50%',
                      background: c.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={10} color="#fff" />
                  </motion.div>
                )}
                <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {c.icon}
                </div>
                <span style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', letterSpacing: '-0.01em' }}>
                  {c.name}
                </span>
              </motion.button>
            )
          })}
        </div>

        {/* Second row spacer to center 2 items */}
      </motion.div>

      {/* Selected Summary */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap', justifyContent: 'center' }}
          >
            {Array.from(selected).map(id => {
              const c = CONNECTORS.find(x => x.id === id)!
              return (
                <motion.span
                  key={id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: c.color,
                    background: `${c.color}10`,
                    border: `1px solid ${c.color}20`,
                    padding: '4px 12px',
                    borderRadius: 20,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {c.name}
                </motion.span>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Import Button */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: selected.size > 0 ? 1 : 0.4, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        onClick={selected.size > 0 ? onImport : undefined}
        whileHover={selected.size > 0 ? { scale: 1.02 } : {}}
        whileTap={selected.size > 0 ? { scale: 0.98 } : {}}
        style={{
          marginTop: 24,
          padding: '14px 40px',
          borderRadius: 12,
          border: 'none',
          background: selected.size > 0 ? '#1a1a1a' : '#ccc',
          color: '#fff',
          fontSize: 15,
          fontWeight: 500,
          cursor: selected.size > 0 ? 'pointer' : 'default',
          letterSpacing: '-0.01em',
          transition: 'background 0.3s ease',
        }}
      >
        Import into Sylvy
      </motion.button>

      {/* Skip option */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        onClick={() => window.location.assign('/demo')}
        style={{
          marginTop: 14,
          padding: '8px 16px',
          border: 'none',
          background: 'transparent',
          color: 'rgba(0,0,0,0.3)',
          fontSize: 12,
          cursor: 'pointer',
          letterSpacing: '0.01em',
        }}
      >
        Skip for now
      </motion.button>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 3 — IMPORTING
   ═══════════════════════════════════════════════ */
function ImportingStep({
  currentStep,
  itemCount,
  selected,
}: {
  currentStep: number
  itemCount: number
  selected: Set<ConnectorId>
}) {
  const progress = Math.min((currentStep / IMPORT_MESSAGES.length) * 100, 100)
  const sources = Array.from(selected).map(id => CONNECTORS.find(x => x.id === id)!.name)

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 460, padding: '0 24px' }}
    >
      {/* Animated Logo */}
      <motion.div
        animate={{ rotate: [0, 3, -3, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        style={{ marginBottom: 24 }}
      >
        <Image src={logoBlack} alt="Sylvy" width={48} height={48} style={{ objectFit: 'contain' }} />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        style={{ fontSize: 22, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 6px' }}
      >
        Setting up your workspace
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        style={{ fontSize: 13, color: '#999', margin: '0 0 32px' }}
      >
        Importing from {sources.join(', ')}
      </motion.p>

      {/* Import Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{
          ...cardStyle,
          borderRadius: 20,
          padding: '32px 28px',
          width: '100%',
        }}
      >
        {/* Progress Bar */}
        <div style={{ height: 4, background: 'rgba(0,0,0,0.05)', borderRadius: 2, marginBottom: 28, overflow: 'hidden' }}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{ height: '100%', background: 'linear-gradient(90deg, #4CAF7D, #6BC89B)', borderRadius: 2 }}
          />
        </div>

        {/* Status Messages */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {IMPORT_MESSAGES.map((msg, i) => {
            const isDone = i < currentStep
            const isCurrent = i === currentStep
            const isPending = i > currentStep
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: isPending ? 0.3 : 1,
                  x: 0,
                }}
                transition={{ delay: 0.35 + i * 0.05, duration: 0.3 }}
                style={{ display: 'flex', alignItems: 'center', gap: 12 }}
              >
                {/* Status Indicator */}
                <div style={{ width: 20, height: 20, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone ? (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>
                      <div style={{
                        width: 18, height: 18, borderRadius: '50%', background: '#4CAF7D',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <CheckIcon size={10} color="#fff" />
                      </div>
                    </motion.div>
                  ) : isCurrent ? (
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{ width: 8, height: 8, borderRadius: '50%', background: '#4CAF7D' }}
                    />
                  ) : (
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'rgba(0,0,0,0.12)' }} />
                  )}
                </div>
                <span style={{
                  fontSize: 13,
                  fontWeight: isCurrent ? 500 : 400,
                  color: isDone ? '#4CAF7D' : isCurrent ? '#1a1a1a' : '#bbb',
                  letterSpacing: '-0.01em',
                  transition: 'color 0.3s',
                }}>
                  {msg}
                </span>
              </motion.div>
            )
          })}
        </div>

        {/* Item Counter */}
        <AnimatePresence>
          {itemCount > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 24,
                padding: '10px 16px',
                borderRadius: 10,
                background: 'rgba(76, 175, 125, 0.06)',
                textAlign: 'center',
              }}
            >
              <span style={{ fontSize: 12, color: '#4CAF7D', fontWeight: 500 }}>
                {itemCount} items processed
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════
   STEP 4 — SUCCESS
   ═══════════════════════════════════════════════ */
function SuccessStep({ onEnter }: { onEnter: () => void }) {
  /* Auto-enter after 4s */
  useEffect(() => {
    const timer = setTimeout(onEnter, 5000)
    return () => clearTimeout(timer)
  }, [onEnter])

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 460, padding: '0 24px' }}
    >
      {/* Success Checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #4CAF7D, #6BC89B)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          boxShadow: '0 4px 20px rgba(76, 175, 125, 0.25)',
        }}
      >
        <CheckIcon size={28} color="#fff" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        style={{ fontSize: 26, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.02em', margin: '0 0 6px' }}
      >
        You&apos;re all set
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        style={{ fontSize: 14, color: '#6b6b6b', margin: '0 0 32px', textAlign: 'center', lineHeight: 1.5 }}
      >
        Your workspace has been populated from your existing sources
      </motion.p>

      {/* Summary Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{
          ...cardStyle,
          borderRadius: 20,
          padding: '24px 28px',
          width: '100%',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {IMPORT_SUMMARY.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.08 }}
              style={{
                padding: '16px',
                borderRadius: 12,
                background: 'rgba(0,0,0,0.02)',
                textAlign: 'center',
              }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6 + i * 0.08, type: 'spring', stiffness: 400, damping: 15 }}
                style={{ fontSize: 28, fontWeight: 600, color: '#1a1a1a', letterSpacing: '-0.03em', lineHeight: 1 }}
              >
                {item.count}
              </motion.div>
              <div style={{ fontSize: 11, color: '#999', marginTop: 4, letterSpacing: '-0.005em' }}>
                {item.label}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={onEnter}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          marginTop: 28,
          padding: '14px 40px',
          borderRadius: 12,
          border: 'none',
          background: '#1a1a1a',
          color: '#fff',
          fontSize: 15,
          fontWeight: 500,
          cursor: 'pointer',
          letterSpacing: '-0.01em',
        }}
      >
        Open workspace
      </motion.button>

      {/* Auto-redirect hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{ fontSize: 11, color: 'rgba(0,0,0,0.25)', marginTop: 16 }}
      >
        Redirecting automatically…
      </motion.p>
    </motion.div>
  )
}

/* ─── Check Icon ─── */
function CheckIcon({ size = 16, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
