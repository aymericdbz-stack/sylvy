const PREF_KEY = 'sylvy_prefs'

interface Preferences {
  timezone?: string
  workStart?: number   // hour integer, e.g. 8 = 08:00
  workEnd?: number     // hour integer, e.g. 19 = 19:00
}

function getPrefs(): Preferences {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}')
  } catch { return {} }
}

function savePrefs(prefs: Preferences): void {
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
}

export function getTimezone(): string {
  return getPrefs().timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function setTimezone(tz: string): void {
  const prefs = getPrefs()
  prefs.timezone = tz
  savePrefs(prefs)
}

export function getWorkHours(): { start: number; end: number } {
  const prefs = getPrefs()
  return {
    start: prefs.workStart ?? 9,
    end:   prefs.workEnd   ?? 18,
  }
}

export function setWorkHours(start: number, end: number): void {
  const prefs = getPrefs()
  prefs.workStart = start
  prefs.workEnd   = end
  savePrefs(prefs)
}
