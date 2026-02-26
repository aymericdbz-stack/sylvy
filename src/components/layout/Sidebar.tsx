import Link from 'next/link'
import {
  BookOpen,
  Plus,
  FlaskConical,
  Archive,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react'
import NavItem from './NavItem'
import { createClient } from '@/lib/supabase/server'

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
      <div className="px-6 py-5 border-b border-nb-cream-border">
        <Link href="/notebook" className="block">
          <span className="text-[18px] font-[700] text-nb-green">Sylvy</span>
          <p className="text-[10px] text-nb-muted uppercase tracking-[0.08em] mt-0.5">WET LAB MIND</p>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-0.5 overflow-y-auto">
        <NavItem
          href="/notebook"
          exact
          icon={<BookOpen size={16} strokeWidth={1.5} />}
          label="Notebook"
        />

        <div className="mx-2 my-1.5">
          <Link
            href="/notebook"
            className="flex items-center gap-3 px-4 py-2.5 rounded-[6px] text-[13px] text-nb-green font-[600] hover:bg-nb-green-light transition-all duration-150"
          >
            <Plus size={16} strokeWidth={1.5} />
            <span>New Project</span>
          </Link>
        </div>

        <div className="border-t border-nb-cream-border mx-4 my-1" />

        <NavItem
          href="/protocols"
          icon={<FlaskConical size={16} strokeWidth={1.5} />}
          label="Protocols"
        />
        {userType === 'lab_manager' && (
          <NavItem
            href="/resources"
            icon={<Archive size={16} strokeWidth={1.5} />}
            label="Resources"
          />
        )}
        <NavItem
          href="/templates"
          icon={<FileText size={16} strokeWidth={1.5} />}
          label="Templates"
        />

        <div className="border-t border-nb-cream-border mx-4 my-1 mt-auto" />

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
