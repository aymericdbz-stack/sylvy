const PREF_KEY = 'sylvy_prefs'

interface Preferences {
  timezone?: string
}

function getPrefs(): Preferences {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(PREF_KEY) ?? '{}')
  } catch { return {} }
}

export function getTimezone(): string {
  return getPrefs().timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function setTimezone(tz: string): void {
  const prefs = getPrefs()
  prefs.timezone = tz
  localStorage.setItem(PREF_KEY, JSON.stringify(prefs))
}
