import Link from 'next/link'
import Image from 'next/image'
import {
  BookOpen,
  FlaskConical,
  Archive,
  FileText,
  Settings,
  LogOut,
  CalendarDays,
} from 'lucide-react'
import NavItem from './NavItem'
import { createClient } from '@/lib/supabase/server'
import logo from '../../../logo/Logo Noir sans Fond.webp'

async function getUserInfo() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { email: '', orgName: '', userType: 'researcher' as const }

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id, user_type, organizations(name)')
    .eq('id', user.id)
    .single()

  const orgName = userRow
    ? (userRow.organizations as { name: string } | null)?.name ?? ''
    : ''
  const userType = (userRow?.user_type === 'lab_manager' ? 'lab_manager' : 'researcher') as 'researcher' | 'lab_manager'

  return { email: user.email ?? '', orgName, userType }
}

export default async function Sidebar() {
  const { email, orgName, userType } = await getUserInfo()

  return (
    <aside className="fixed top-0 left-0 h-full w-[220px] bg-white border-r border-nb-cream-border flex flex-col z-20 font-nb-mono">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-nb-cream-border flex justify-center">
        <Link href="/notebook" className="flex items-center gap-3">
          <Image
            src={logo}
            alt="Sylvy logo"
            width={26}
            height={26}
            className="h-6 w-6 object-contain"
            priority
          />
          <span className="text-[13px] font-[600] tracking-[0.2em] uppercase text-nb-charcoal">
            Sylvy
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col overflow-y-auto">
        <NavItem
          href="/notebook"
          exact
          icon={<BookOpen size={16} strokeWidth={1.5} />}
          label="Notebook"
        />

        <p className="px-4 pt-5 pb-1 text-[9px] font-[600] tracking-[0.15em] uppercase text-nb-muted-light select-none">Lab</p>

        <NavItem
          href="/protocols"
          icon={<FlaskConical size={16} strokeWidth={1.5} />}
          label="Protocols"
        />
        <NavItem
          href="/templates"
          icon={<FileText size={16} strokeWidth={1.5} />}
          label="Templates"
        />

        <p className="px-4 pt-5 pb-1 text-[9px] font-[600] tracking-[0.15em] uppercase text-nb-muted-light select-none">Planning</p>

        <NavItem
          href="/planner"
          icon={<CalendarDays size={16} strokeWidth={1.5} />}
          label="Planner"
          accent="orange"
        />

        <div className="flex-1" />

        <div className="border-t border-nb-cream-border mx-4 mb-1" />

        <NavItem
          href="/resources"
          icon={<Archive size={16} strokeWidth={1.5} />}
          label="Resources"
        />
        <NavItem
          href="/settings"
          icon={<Settings size={16} strokeWidth={1.5} />}
          label="Settings"
        />
      </nav>

      {/* User info + logout */}
      <div className="px-4 py-4 border-t border-nb-cream-border">
        <p className="text-[11px] font-[600] text-nb-charcoal truncate">{orgName}</p>
        <p className="text-[11px] text-nb-muted truncate mt-0.5">{email}</p>
        <form action="/api/auth/signout" method="POST">
          <button
            type="submit"
            className="mt-3 flex items-center gap-2 text-[11px] text-nb-muted hover:text-nb-charcoal transition-colors duration-150"
          >
            <LogOut size={14} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </aside>
  )
}
