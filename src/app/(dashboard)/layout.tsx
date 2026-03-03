import Sidebar from '@/components/layout/Sidebar'
import DashboardClientShell from './DashboardClientShell'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="nb-app min-h-screen">
      <Sidebar />
      <DashboardClientShell>{children}</DashboardClientShell>
    </div>
  )
}
