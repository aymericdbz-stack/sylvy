import { createClient } from '@/lib/supabase/server'
import { getProjects } from '@/lib/queries/projects'
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
      <div className="mb-8">
        <h1 className="text-[22px] font-[700] text-primary">Lab Notebook</h1>
      </div>

      {/* Projects section */}
      <div className="mb-4">
        <p className="text-[12px] font-[600] text-nb-muted tracking-[0.08em] uppercase">
          Projects
        </p>
      </div>

      <ProjectListClient projects={projects} />
    </div>
  )
}
