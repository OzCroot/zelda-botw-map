import { useEffect, useMemo, useRef } from 'react'
import { Command, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { CATEGORY_BY_ID } from '@/data/categories'
import { searchMarkers } from '@/lib/search'
import { useUi } from '@/store/ui'
import type { Marker } from '@/types/marker'

export function SearchBox() {
  const query = useUi((s) => s.query)
  const setQuery = useUi((s) => s.setQuery)
  const select = useUi((s) => s.select)
  const ref = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchMarkers(query), [query])

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

  const pick = (m: Marker) => {
    select(m.id)
    setQuery('')
    ref.current?.blur()
  }

  return (
    <div className="relative">
      <Command shouldFilter={false} loop className="h-auto overflow-visible p-0">
        <CommandInput
          ref={ref}
          value={query}
          onValueChange={setQuery}
          placeholder="Search…  ( / )"
          aria-label="Search markers"
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setQuery('')
              ref.current?.blur()
            }
          }}
        />
        {results.length > 0 && (
          <CommandList className="absolute top-full z-[1500] mt-1 w-full rounded-xl border border-border bg-popover shadow-xl">
            <CommandGroup>
              {results.map((m) => {
                const cat = CATEGORY_BY_ID[m.category]
                return (
                  <CommandItem key={m.id} value={m.id} onSelect={() => pick(m)} className="min-h-11 md:min-h-8">
                    <span style={{ color: cat?.color }} aria-hidden>
                      {cat?.glyph}
                    </span>
                    <span className="truncate">{m.name}</span>
                    <span className="ml-auto shrink-0 pl-2 text-xs whitespace-nowrap text-muted-foreground">{cat?.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        )}
      </Command>
    </div>
  )
}
