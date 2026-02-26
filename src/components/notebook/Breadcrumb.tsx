import Link from 'next/link'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbSegment {
  label: string
  href: string
}

interface BreadcrumbProps {
  segments: BreadcrumbSegment[]
}

export default function Breadcrumb({ segments }: BreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1.5 text-[13px] font-nb-mono mb-6">
      {segments.map((segment, i) => {
        const isLast = i === segments.length - 1
        return (
          <span key={segment.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} strokeWidth={1.5} className="text-nb-muted-light" />}
            {isLast ? (
              <span className="font-[600] text-nb-charcoal">{segment.label}</span>
            ) : (
              <Link
                href={segment.href}
                className="text-nb-muted hover:text-nb-charcoal transition-colors"
              >
                {segment.label}
              </Link>
            )}
          </span>
        )
      })}
    </nav>
  )
}
