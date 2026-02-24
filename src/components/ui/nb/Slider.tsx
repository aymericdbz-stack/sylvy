'use client'

interface SliderProps {
  min?: number
  max?: number
  value: number
  onChange: (value: number) => void
  label?: string
}

export default function Slider({ min = 0, max = 10, value, onChange, label }: SliderProps) {
  return (
    <div className="flex flex-col gap-2 font-nb-mono">
      {label && (
        <label className="text-[11px] font-[600] text-nb-muted uppercase tracking-[0.04em]">
          {label}
        </label>
      )}
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="nb-slider"
      />
      <div className="flex justify-between text-[11px] text-nb-muted">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
