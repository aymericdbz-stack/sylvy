import { redirect } from 'next/navigation'

export default async function EditExperimentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  redirect(`/experiments/${id}`)
}
