import { Toaster } from 'sonner'

export const metadata = {
  title: 'Lab Snapshot — Sylvy',
  description: 'Generate a structured experiment report in seconds. Your data never leaves your browser.',
}

export default function LabSnapshotLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nb-app min-h-screen">
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#F5F0E8',
            border: '1px solid #D8D2C8',
            color: '#1A1A1A',
            fontFamily: '"JetBrains Mono", ui-monospace, monospace',
            fontSize: '13px',
          },
        }}
      />
    </div>
  )
}
