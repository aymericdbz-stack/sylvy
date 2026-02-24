import { Toaster } from 'sonner'
import Sidebar from '@/components/layout/Sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nb-app min-h-screen">
      <Sidebar />
      <main className="ml-[220px] min-h-screen px-10 py-8">
        <div className="max-w-[960px] mx-auto">
          {children}
        </div>
      </main>
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
