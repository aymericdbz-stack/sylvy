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
    ? 'text-[#1C1917] font-[600] bg-[#FFF7ED] border-l-2 border-[#F97316] pl-[14px]'
    : 'text-nb-charcoal font-[600] bg-nb-cream border-l-2 border-nb-green pl-[14px]'

  const hoverClasses = accent === 'orange'
    ? 'text-nb-muted hover:bg-[#FFF7ED] hover:text-[#1C1917]'
    : 'text-nb-muted hover:bg-nb-cream hover:text-nb-charcoal'

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-[6px] mx-2 text-[13px] transition-all duration-150',
        isActive ? activeClasses : hoverClasses
      )}
    >
      <span className={cn('shrink-0', isActive && accent === 'orange' && 'text-[#F97316]')}>
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  )
}
