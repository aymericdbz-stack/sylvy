'use client'

import { Toaster } from 'sonner'
import { usePathname } from 'next/navigation'

export default function DashboardClientShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const isPlannerRoute =
    pathname === '/planner' || pathname?.startsWith('/planner/')

  const mainClassName = isPlannerRoute
    ? 'ml-[220px] min-h-screen p-0'
    : 'ml-[220px] min-h-screen px-10 py-8'

  return (
    <>
      <main className={mainClassName}>{children}</main>
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
    </>
  )
}

