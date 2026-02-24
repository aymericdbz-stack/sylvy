import { cn } from '@/lib/utils'

interface Column<T> {
  key: string
  header: string
  render?: (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T extends Record<string, unknown>> {
  columns: Column<T>[]
  rows: T[]
  keyField?: string
  className?: string
  onRowClick?: (row: T) => void
}

export default function Table<T extends Record<string, unknown>>({
  columns, rows, keyField = 'id', className, onRowClick,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-nb-cream-border bg-nb-cream">
            {columns.map((col) => (
              <th key={col.key} className={cn('text-[11px] font-[600] uppercase tracking-[0.04em] text-nb-muted py-2.5 px-4 text-left', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={String(row[keyField])}
              onClick={() => onRowClick?.(row)}
              className={cn('border-b border-nb-cream-border transition-colors duration-150', onRowClick && 'cursor-pointer hover:bg-nb-cream')}
            >
              {columns.map((col) => (
                <td key={col.key} className={cn('py-3 px-4 text-[13px] text-nb-charcoal font-nb-mono', col.className)}>
                  {col.render ? col.render(row) : String(row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
