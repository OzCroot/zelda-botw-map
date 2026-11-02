import { Command } from 'cmdk'
import { Layers, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CATEGORIES, CATEGORY_BY_ID } from '@/data/categories'
import { MARKERS, REGION_BY_ID } from '@/data/loadMarkers'
import { once } from '@/lib/once'
import { searchMarkers } from '@/lib/search'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'
import type { Marker } from '@/types/marker'
import { CategoryIcon } from '../map/CategoryIcon'

const getCounts = once(() => {
  const counts: Record<string, number> = {}
  for (const m of MARKERS) counts[m.category] = (counts[m.category] ?? 0) + 1
  return counts
})

const item =
  'flex min-h-12 cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 text-sm outline-none data-[selected=true]:bg-accent sm:min-h-11'

export function SearchBox() {
  const query = useUi((s) => s.query)
  const setQuery = useUi((s) => s.setQuery)
  const reveal = useUi((s) => s.reveal)
  const ref = useRef<HTMLInputElement>(null)
  const [focused, setFocused] = useState(false)
  const q = query.trim().toLowerCase()
  const results = useMemo(() => searchMarkers(query), [query])
  // A query that names a category offers "show all of them" first: far more useful than 30 near-identical rows.
  const cats = useMemo(
    () =>
      q.length < 2 ? [] : CATEGORIES.filter((c) => c.label.toLowerCase().includes(q)).slice(0, 2),
    [q],
  )
  const open = focused && q.length > 0

  // "/" focuses the search box from anywhere outside a text field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const done = () => {
    setQuery('')
    ref.current?.blur()
    useUi.getState().setMenuOpen(false)
  }
  const pick = (m: Marker) => {
    const { enabledCategory, enabledMasterMode } = reveal(m.id)
    if (enabledMasterMode) toast('Master Mode items are now shown')
    else if (enabledCategory)
      toast(`Showing ${CATEGORY_BY_ID[m.category]?.label ?? 'category'} on the map`)
    done()
  }
  const pickCategory = (id: string) => {
    useUi.getState().soloCategory(id)
    useUi.getState().setRegion(null)
    toast(`Showing only ${CATEGORY_BY_ID[id]?.label}`)
    done()
  }

  return (
    <Command shouldFilter={false} loop className="relative">
      <div
        className={cn(
          'flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/92 px-3 shadow-lg backdrop-blur-md transition-[border-color,box-shadow]',
          'focus-within:border-ring/70 focus-within:ring-3 focus-within:ring-ring/25',
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <Command.Input
          ref={ref}
          value={query}
          onValueChange={(v) => {
            setQuery(v)
            // Searching takes over: get the menu out of the way of the results and the map.
            if (v) useUi.getState().setMenuOpen(false)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search Hyrule"
          aria-label="Search markers"
          className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.stopPropagation()
              if (query) setQuery('')
              else ref.current?.blur()
            }
          }}
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            // keep focus in the input
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setQuery('')}
            className="grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="size-3.5" />
          </button>
        ) : (
          <kbd className="hidden h-5 min-w-5 shrink-0 place-items-center rounded border border-border px-1 text-[11px] text-muted-foreground sm:grid">
            /
          </kbd>
        )}
      </div>

      {open && (
        <Command.List
          // mousedown would blur the input before the click lands
          onMouseDown={(e) => e.preventDefault()}
          className="absolute top-full right-0 left-0 z-[1500] mt-1.5 overflow-hidden rounded-xl border border-border/70 bg-background/95 shadow-xl backdrop-blur-md"
        >
          <ScrollArea viewportClassName="max-h-[min(24rem,60dvh)]">
            <div className="p-1.5">
              {cats.map((c) => (
                <Command.Item
                  key={c.id}
                  value={`cat:${c.id}`}
                  onSelect={() => pickCategory(c.id)}
                  className={item}
                >
                  <CategoryIcon id={c.id} className="size-7" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">Show all {c.label}</span>
                    <span className="block text-xs text-muted-foreground">
                      {getCounts()[c.id] ?? 0} on the map
                    </span>
                  </span>
                  <Layers className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                </Command.Item>
              ))}
              {results.map((m) => {
                const cat = CATEGORY_BY_ID[m.category]
                const where = [
                  cat?.label,
                  m.region && REGION_BY_ID[m.region]?.label,
                  m.description,
                ].filter(Boolean)
                return (
                  <Command.Item key={m.id} value={m.id} onSelect={() => pick(m)} className={item}>
                    <CategoryIcon id={m.category} markerId={m.id} className="size-7" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate">{m.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {where.join(' · ')}
                      </span>
                    </span>
                  </Command.Item>
                )
              })}
              {results.length === 0 && cats.length === 0 && (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                  Nothing found for “{query.trim()}”
                </div>
              )}
            </div>
          </ScrollArea>
        </Command.List>
      )}
    </Command>
  )
}
