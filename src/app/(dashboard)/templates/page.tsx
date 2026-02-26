import Link from 'next/link'
import { getAuthenticatedUser, getUserOrg } from '@/lib/auth-helpers'
import { getTemplates } from '@/lib/queries/templates'
import Button from '@/components/ui/nb/Button'
import TemplatesClient from './TemplatesClient'

export default async function TemplatesPage() {
  const { user } = await getAuthenticatedUser()
  const orgId = await getUserOrg(user.id)
  const templates = await getTemplates(orgId)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-[700] text-nb-charcoal">Report Templates</h1>
        <Link href="/templates/new">
          <Button variant="primary">New Template</Button>
        </Link>
      </div>

      <TemplatesClient templates={templates} orgId={orgId} />
    </div>
  )
}
