import { useVirtualizer } from '@tanstack/react-virtual'
import { Check } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../../data/categories'
import { REGION_BY_ID } from '../../data/loadMarkers'
import { useVisibleMarkers } from '../../hooks/useVisibleMarkers'
import { toggleWithUndo } from '../../hooks/useToggleWithUndo'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'

type Sort = 'name' | 'category' | 'region'

export function MarkerList() {
  const visible = useVisibleMarkers()
  const completed = useProgress((s) => s.completed)
  const { select, selectedId, region, setRegion } = useUi()
  const [sort, setSort] = useState<Sort>('category')
  const ref = useRef<HTMLDivElement>(null)

  const rows = useMemo(
    () =>
      [...visible].sort((a, b) =>
        sort === 'name'
          ? a.name.localeCompare(b.name, undefined, { numeric: true })
          : sort === 'region'
            ? (a.region ?? '').localeCompare(b.region ?? '') || a.name.localeCompare(b.name, undefined, { numeric: true })
            : a.category.localeCompare(b.category) || a.name.localeCompare(b.name, undefined, { numeric: true }),
      ),
    [visible, sort],
  )
  const v = useVirtualizer({ count: rows.length, getScrollElement: () => ref.current, estimateSize: () => 52, overscan: 8 })

  return (
    <div className="flex h-full min-h-72 flex-col">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-muted">{rows.length} shown</span>
        {region && (
          <button className="chip" onClick={() => setRegion(null)}>
            {REGION_BY_ID[region]?.label} ✕
          </button>
        )}
        <select className="field ml-auto w-auto" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort by">
          <option value="category">Sort: category</option>
          <option value="name">Sort: name</option>
          <option value="region">Sort: region</option>
        </select>
      </div>
      <div ref={ref} className="min-h-0 flex-1 overflow-auto">
        <div style={{ height: v.getTotalSize(), position: 'relative' }}>
          {v.getVirtualItems().map((vi) => {
            const m = rows[vi.index]!
            const cat = CATEGORY_BY_ID[m.category]
            const done = m.id in completed
            return (
              <div
                key={m.id}
                className={`absolute inset-x-0 flex items-center gap-2 rounded-lg ${m.id === selectedId ? 'bg-card' : ''}`}
                style={{ height: vi.size, transform: `translateY(${vi.start}px)` }}
              >
                <button className="flex min-w-0 flex-1 items-center gap-3 px-2 text-left" onClick={() => select(m.id)}>
                  <span className="grid size-7 shrink-0 place-items-center rounded-full text-xs" style={{ background: cat?.color, color: '#0f172a' }}>
                    {cat?.glyph}
                  </span>
                  <span className="min-w-0">
                    <span className={`block truncate text-sm ${done ? 'text-muted line-through' : ''}`}>{m.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {cat?.label} · {REGION_BY_ID[m.region ?? '']?.label}
                    </span>
                  </span>
                </button>
                {cat?.checkable && (
                  <button
                    role="checkbox"
                    aria-checked={done}
                    aria-label={`Complete ${m.name}`}
                    onClick={() => toggleWithUndo(m.id)}
                    className={`mr-1 grid size-11 shrink-0 place-items-center ${done ? 'text-emerald-400' : 'text-muted'}`}
                  >
                    <span className={`grid size-6 place-items-center rounded-md border ${done ? 'border-emerald-400 bg-emerald-400/20' : 'border-line'}`}>
                      {done && <Check size={16} />}
                    </span>
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
