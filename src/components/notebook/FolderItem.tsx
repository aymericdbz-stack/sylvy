import Link from 'next/link'
import { Folder, ChevronRight } from 'lucide-react'
import { formatTimeAgo } from '@/lib/utils'

interface FolderItemProps {
  name: string
  href: string
  itemCount: number
  itemLabel: string
  createdAt: string
}

export default function FolderItem({ name, href, itemCount, itemLabel, createdAt }: FolderItemProps) {
  return (
    <Link href={href}>
      <div className="flex items-center gap-3 px-4 py-3 bg-white border border-nb-cream-border rounded-[8px] mb-2 font-nb-mono hover:border-nb-green/40 hover:shadow-sm transition-all duration-150 cursor-pointer group">
        <Folder size={18} strokeWidth={1.5} className="text-nb-green shrink-0" />

        <span className="flex-1 text-[15px] font-[600] text-nb-charcoal group-hover:text-nb-green transition-colors">
          {name}
        </span>

        <span className="text-[11px] text-nb-muted-light shrink-0">
          {itemCount} {itemLabel}{itemCount !== 1 ? 's' : ''}
        </span>

        <span className="text-[11px] text-nb-muted-light shrink-0">
          {formatTimeAgo(createdAt)}
        </span>

        <ChevronRight size={14} strokeWidth={1.5} className="text-nb-muted-light group-hover:text-nb-green transition-colors shrink-0" />
      </div>
    </Link>
  )
}
