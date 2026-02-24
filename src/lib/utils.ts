import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy')
}

export function formatDateShort(date: string | Date): string {
  return format(new Date(date), 'd MMM')
}

export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'd MMM yyyy, HH:mm')
}

export function formatTimeAgo(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function formatDateGroupKey(date: string | Date): string {
  return format(new Date(date), 'yyyy-MM-dd')
}

/** Formats a PostgreSQL interval string like "02:30:00" → "2h 30min" */
export function formatInterval(interval: string | null): string {
  if (!interval) return '—'
  const match = interval.match(/(\d+):(\d+):(\d+)/)
  if (!match) return interval
  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)
  const parts: string[] = []
  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0) parts.push(`${minutes}min`)
  return parts.length > 0 ? parts.join(' ') : '< 1min'
}

export function isExpiringSoon(date: string | null, daysThreshold = 30): boolean {
  if (!date) return false
  const expiry = new Date(date)
  const threshold = new Date()
  threshold.setDate(threshold.getDate() + daysThreshold)
  return expiry <= threshold
}
