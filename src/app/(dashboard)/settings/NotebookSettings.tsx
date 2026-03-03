'use client'

export default function NotebookSettings() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[15px] font-[700] text-nb-charcoal font-nb-mono mb-1">
          Notebook
        </h2>
        <p className="text-[12px] text-nb-muted font-nb-mono">
          Configure how your lab notebook behaves. More options will arrive soon.
        </p>
      </div>

      <div className="bg-white border border-nb-cream-border rounded-[8px] p-5">
        <p className="text-[11px] text-nb-muted font-nb-mono">
          No specific notebook settings yet. Everything works with the default configuration.
        </p>
      </div>
    </div>
  )
}

