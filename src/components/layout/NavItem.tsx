'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

interface NavItemProps {
  href: string
  icon: React.ReactNode
  label: string
  exact?: boolean
}

export default function NavItem({ href, icon, label, exact = false }: NavItemProps) {
  const pathname = usePathname()
  const isActive = exact ? pathname === href : pathname.startsWith(href)

  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3 px-4 py-2.5 rounded-[6px] mx-2 text-[13px] transition-all duration-150',
        isActive
          ? 'text-nb-charcoal font-[600] bg-nb-cream border-l-2 border-nb-green pl-[14px]'
          : 'text-nb-muted hover:bg-nb-cream hover:text-nb-charcoal'
      )}
    >
      <span className="shrink-0">{icon}</span>
      <span>{label}</span>
    </Link>
  )
}
