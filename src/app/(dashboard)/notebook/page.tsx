import { Sparkles, Filter } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/queries/projects'
import Button from '@/components/ui/nb/Button'
import Tooltip from '@/components/ui/nb/Tooltip'
import ProjectListClient from '@/components/notebook/ProjectListClient'

async function getNotebookData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { projects: [], orgId: '' }

  const { data: userRow } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', user.id)
    .single()

  if (!userRow) return { projects: [], orgId: '' }

  const projects = await getProjects(userRow.org_id)
  return { projects, orgId: userRow.org_id }
}

export default async function NotebookPage() {
  const { projects } = await getNotebookData()

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Lab Notebook</h1>
        <div className="flex items-center gap-2">
          <Tooltip content="Coming soon — AI search across all your experiments">
            <Button variant="secondary" disabled>
              <Sparkles size={14} strokeWidth={1.5} />
              Smart Research
            </Button>
          </Tooltip>
          <button className="p-2 text-nb-muted hover:text-nb-charcoal hover:bg-nb-cream rounded-[6px] transition-colors">
            <Filter size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Projects list */}
      <ProjectListClient projects={projects} />
    </div>
  )
}
