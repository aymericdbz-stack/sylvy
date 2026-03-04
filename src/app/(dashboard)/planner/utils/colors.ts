export const PLANNER_COLOR_PALETTE: string[] = [
  // Warm
  '#F97316', // orange
  '#F59E0B', // amber
  '#EAB308', // yellow
  '#84CC16', // lime
  '#22C55E', // green
  '#10B981', // emerald
  '#14B8A6', // teal
  '#06B6D4', // cyan
  '#0EA5E9', // sky
  '#3B82F6', // blue
  '#6366F1', // indigo
  '#8B5CF6', // violet
  '#A855F7', // purple
  '#D946EF', // fuchsia
  '#EC4899', // pink
  '#F43F5E', // rose
  '#EF4444', // red

  // Extra distinct accents (kept vivid, good contrast on light backgrounds)
  '#FB7185', // rose 400 (lighter accent)
  '#F472B6', // pink 400
  '#C026D3', // fuchsia 600
  '#7C3AED', // violet 600
  '#2563EB', // blue 600
  '#0891B2', // cyan 600
  '#4CAF7D', // custom green used in app
]

function normalizeHex(c: string): string {
  return c.trim().toLowerCase()
}

function hslToHex(h: number, s: number, l: number): string {
  // h: 0..360, s/l: 0..1
  const c = (1 - Math.abs(2 * l - 1)) * s
  const hp = (h % 360) / 60
  const x = c * (1 - Math.abs((hp % 2) - 1))
  let r1 = 0, g1 = 0, b1 = 0
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x; b1 = 0 }
  else if (hp < 2)       { r1 = x; g1 = c; b1 = 0 }
  else if (hp < 3)       { r1 = 0; g1 = c; b1 = x }
  else if (hp < 4)       { r1 = 0; g1 = x; b1 = c }
  else if (hp < 5)       { r1 = x; g1 = 0; b1 = c }
  else                   { r1 = c; g1 = 0; b1 = x }
  const m = l - c / 2
  const to255 = (v: number) => Math.round((v + m) * 255)
  const r = to255(r1)
  const g = to255(g1)
  const b = to255(b1)
  const hex = (n: number) => n.toString(16).padStart(2, '0')
  return `#${hex(r)}${hex(g)}${hex(b)}`.toUpperCase()
}

/** Picks a color not already in `usedColors`, preferring `preferred` if possible. */
export function pickDistinctPlannerColor(
  usedColors: Array<string | null | undefined>,
  preferred?: string | null,
): string {
  const used = new Set(
    usedColors
      .filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      .map(normalizeHex),
  )

  if (preferred && preferred.trim().length > 0) {
    const p = normalizeHex(preferred)
    if (!used.has(p)) return preferred
  }

  for (const c of PLANNER_COLOR_PALETTE) {
    if (!used.has(normalizeHex(c))) return c
  }

  // Fallback: generate a new vivid HEX color (HSL hue sweep).
  // Keeps downstream HEX-only helpers (rgba parsing) safe.
  for (let i = 0; i < 360; i++) {
    const hue = (i * 37) % 360
    const candidate = hslToHex(hue, 0.85, 0.5)
    if (!used.has(normalizeHex(candidate))) return candidate
  }

  return PLANNER_COLOR_PALETTE[0] ?? '#F97316'
}

