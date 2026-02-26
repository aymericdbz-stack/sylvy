'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, Download, Trash2, File } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/utils'
import Badge from '@/components/ui/nb/Badge'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import type { ExperimentFile } from '@/lib/supabase/types'

const MAX_SIZE = 50 * 1024 * 1024

const ALLOWED_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.webp', '.heic', '.tif', '.tiff',
  '.pdf',
  '.csv', '.tsv', '.xlsx', '.xls',
]

interface FileUploaderProps {
  experimentId: string
  orgId: string
  initialFiles: ExperimentFile[]
}

export default function FileUploader({ experimentId, orgId, initialFiles }: FileUploaderProps) {
  const [files, setFiles] = useState<ExperimentFile[]>(initialFiles)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isAllowedFile = (file: File) => {
    const lowerName = file.name.toLowerCase()
    const hasAllowedExtension = ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
    if (hasAllowedExtension) return true

    const type = file.type
    if (type.startsWith('image/')) return true
    if (type === 'application/pdf') return true
    if (
      type === 'text/csv' ||
      type === 'text/tab-separated-values' ||
      type === 'application/vnd.ms-excel' ||
      type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ) {
      return true
    }

    return false
  }

  const uploadFile = useCallback(async (file: File) => {
    if (!isAllowedFile(file)) {
      toast.error('Only images (HEIC/JPEG/PNG/WEBP), tables (CSV/XLSX), and PDFs can be uploaded as raw data.')
      return
    }

    if (file.size > MAX_SIZE) {
      toast.error(`${file.name} exceeds the 50MB limit`)
      return
    }

    setUploading(true)
    const supabase = createClient()
    const path = `${orgId}/${experimentId}/${Date.now()}_${file.name}`

    const { error: uploadErr } = await supabase.storage
      .from('experiment-files')
      .upload(path, file)

    if (uploadErr) {
      toast.error('Upload failed')
      setUploading(false)
      return
    }

    const { data: urlData } = supabase.storage.from('experiment-files').getPublicUrl(path)

    const { data: record, error: insertErr } = await supabase
      .from('experiment_files')
      .insert({
        experiment_id: experimentId,
        file_name: file.name,
        file_type: file.type || 'application/octet-stream',
        storage_url: urlData.publicUrl,
      })
      .select()
      .single()

    if (insertErr) {
      toast.error('Failed to save file record')
    } else {
      setFiles((prev) => [record, ...prev])
      toast.success(`${file.name} uploaded`)
    }
    setUploading(false)
  }, [experimentId, orgId])

  const handleFiles = (fileList: FileList) => {
    Array.from(fileList).forEach(uploadFile)
  }

  const handleDelete = async (fileRecord: ExperimentFile) => {
    const supabase = createClient()
    const url = new URL(fileRecord.storage_url)
    const path = url.pathname.split('/experiment-files/').at(1)
    if (path) await supabase.storage.from('experiment-files').remove([path])
    await supabase.from('experiment_files').delete().eq('id', fileRecord.id)
    setFiles((prev) => prev.filter((f) => f.id !== fileRecord.id))
    toast.success('File deleted')
  }

  return (
    <div className="font-nb-mono">
      {/* Upload zone */}
      <div
        className={cn(
          'border-2 border-dashed rounded-[8px] p-8 text-center cursor-pointer transition-colors duration-150',
          dragging
            ? 'border-nb-green bg-nb-green-light'
            : 'border-nb-cream-border hover:border-nb-green hover:bg-nb-cream'
        )}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files)
        }}
      >
        <Upload size={24} strokeWidth={1.5} className="mx-auto mb-2 text-nb-muted" />
        <p className="text-[13px] text-nb-muted">
          {uploading ? 'Uploading...' : 'Drop files here or click to upload'}
        </p>
        <p className="text-[11px] text-nb-muted-light mt-1">
          Max 50MB per file. Images (HEIC/JPEG/PNG/WEBP), tables (CSV/XLSX), and PDFs are supported.
        </p>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ALLOWED_EXTENSIONS.join(',')}
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-4 flex flex-col gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 p-3 bg-white border border-nb-cream-border rounded-[6px]"
            >
              <File size={16} strokeWidth={1.5} className="text-nb-muted shrink-0" />
              <span className="flex-1 text-[13px] font-[600] text-nb-charcoal truncate">
                {f.file_name}
              </span>
              <Badge variant="gray">{f.file_type.split('/').at(-1) ?? 'file'}</Badge>
              <span className="text-[11px] text-nb-muted-light shrink-0">
                {formatDate(f.uploaded_at)}
              </span>
              <a
                href={f.storage_url}
                target="_blank"
                rel="noreferrer"
                className="text-nb-muted hover:text-nb-charcoal transition-colors p-1"
              >
                <Download size={14} strokeWidth={1.5} />
              </a>
              <button
                onClick={() => handleDelete(f)}
                className="text-nb-muted hover:text-nb-error transition-colors p-1"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
