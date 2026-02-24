import { createClient } from '@/lib/supabase/server'
import type { ExperimentFile } from '@/lib/supabase/types'

const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

export async function uploadExperimentFile(
  experimentId: string,
  file: File,
  orgId: string
): Promise<ExperimentFile> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File exceeds maximum size of 50MB')
  }

  const supabase = await createClient()
  const path = `${orgId}/${experimentId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('experiment-files')
    .upload(path, file)

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from('experiment-files')
    .getPublicUrl(path)

  const { data, error } = await supabase
    .from('experiment_files')
    .insert({
      experiment_id: experimentId,
      file_name: file.name,
      file_type: file.type || 'application/octet-stream',
      storage_url: urlData.publicUrl,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteExperimentFile(id: string, storageUrl: string, orgId: string): Promise<void> {
  const supabase = await createClient()

  // Extract path from URL
  const url = new URL(storageUrl)
  const path = url.pathname.split('/experiment-files/').at(1)
  if (path) {
    await supabase.storage.from('experiment-files').remove([path])
  }

  const { error } = await supabase.from('experiment_files').delete().eq('id', id)
  if (error) throw error
}

export async function getExperimentFiles(experimentId: string): Promise<ExperimentFile[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('experiment_files')
    .select('*')
    .eq('experiment_id', experimentId)
    .order('uploaded_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function getSignedUrl(storagePath: string): Promise<string> {
  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('experiment-files')
    .createSignedUrl(storagePath, 3600)
  if (error) throw error
  return data.signedUrl
}
