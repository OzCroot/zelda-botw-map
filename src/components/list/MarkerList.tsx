import { useVirtualizer } from '@tanstack/react-virtual'
import { X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORY_BY_ID } from '@/data/categories'
import { REGION_BY_ID } from '@/data/loadMarkers'
import { toggleWithUndo } from '@/hooks/useToggleWithUndo'
import { useVisibleMarkers } from '@/hooks/useVisibleMarkers'
import { useProgress } from '@/store/progress'
import { useUi } from '@/store/ui'

type Sort = 'name' | 'category' | 'region'
const SORTS = [
  { value: 'category', label: 'Sort: category' },
  { value: 'name', label: 'Sort: name' },
  { value: 'region', label: 'Sort: region' },
]
const byName = (a: { name: string }, b: { name: string }) =>
  a.name.localeCompare(b.name, undefined, { numeric: true })

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
          ? byName(a, b)
          : sort === 'region'
            ? (a.region ?? '').localeCompare(b.region ?? '') || byName(a, b)
            : a.category.localeCompare(b.category) || byName(a, b),
      ),
    [visible, sort],
  )
  const v = useVirtualizer({ count: rows.length, getScrollElement: () => ref.current, estimateSize: () => 52, overscan: 8 })

  return (
    <div className="flex h-full min-h-72 flex-col">
      <div className="mb-2 flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">{rows.length} shown</span>
        {region && (
          <Button variant="secondary" size="xs" onClick={() => setRegion(null)}>
            {REGION_BY_ID[region]?.label} <X data-icon="inline-end" />
          </Button>
        )}
        <Select items={SORTS} value={sort} onValueChange={(s) => s && setSort(s as Sort)}>
          <SelectTrigger className="ml-auto w-auto" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <ScrollArea viewportRef={ref} className="min-h-0 flex-1">
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
                <Button
                  variant="ghost"
                  className="h-full min-w-0 flex-1 justify-start gap-3 px-2 text-left"
                  onClick={() => select(m.id)}
                >
                  <span
                    className="grid size-7 shrink-0 place-items-center rounded-full text-xs"
                    style={{ background: cat?.color, color: '#0f172a' }}
                    aria-hidden
                  >
                    {cat?.glyph}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-sm ${done ? 'text-muted-foreground line-through' : ''}`}>
                      {m.name}
                    </span>
                    <span className="block truncate text-xs font-normal text-muted-foreground">
                      {cat?.label} · {REGION_BY_ID[m.region ?? '']?.label}
                    </span>
                  </span>
                </Button>
                {cat?.checkable && (
                  <div className="grid size-11 shrink-0 place-items-center">
                    <Checkbox
                      className="size-5"
                      checked={done}
                      onCheckedChange={() => toggleWithUndo(m.id)}
                      aria-label={`Complete ${m.name}`}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
