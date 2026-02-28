'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
  accent?: 'green' | 'orange'
}

export default function NavItem({ href, icon, label, exact = false, accent = 'green' }: NavItemProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  const activeClasses = accent === 'orange'
    ? 'text-[#1C1917] font-[500] bg-[#FFF7ED]'
    : 'text-nb-charcoal font-[500] bg-nb-cream'

  const activeIconClass = accent === 'orange' ? 'text-[#F97316]' : 'text-nb-green'

  const hoverClasses = accent === 'orange'
    ? 'text-nb-muted hover:bg-[#FFF7ED]/60 hover:text-[#1C1917]'
    : 'text-nb-muted hover:bg-nb-cream/60 hover:text-nb-charcoal'

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-3 py-2 rounded-[6px] mx-2 text-[13px] transition-all duration-150',
        isActive ? activeClasses : hoverClasses
      )}
    >
      <span className={cn('shrink-0', isActive && activeIconClass)}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {isActive && (
        <span className={cn(
          'w-1.5 h-1.5 rounded-full shrink-0',
          accent === 'orange' ? 'bg-[#F97316]' : 'bg-nb-green'
        )} />
      )}
    </Link>
  )
}
