import { Search } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { CATEGORY_BY_ID } from '../../data/categories'
import { searchMarkers } from '../../lib/search'
import { useUi } from '../../store/ui'

export function SearchBox() {
  const { query, setQuery, select } = useUi()
  const [cursor, setCursor] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const results = useMemo(() => searchMarkers(query), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(t.tagName)) {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  const pick = (i: number) => {
    const m = results[i]
    if (!m) return
    select(m.id)
    setQuery('')
    ref.current?.blur()
  }

  return (
    <div className="relative">
      <Search size={16} className="pointer-events-none absolute top-3.5 left-3 text-muted-foreground" />
      <input
        ref={ref}
        className="field pl-9"
        placeholder="Search…  ( / )"
        aria-label="Search markers"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setCursor(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setCursor((c) => Math.min(c + 1, results.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setCursor((c) => Math.max(c - 1, 0))
          } else if (e.key === 'Enter') pick(cursor)
          else if (e.key === 'Escape') {
            setQuery('')
            ref.current?.blur()
          }
        }}
      />
      {results.length > 0 && (
        <ul className="absolute z-[1000] mt-1 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card shadow-xl" role="listbox">
          {results.map((m, i) => (
            <li key={m.id} role="option" aria-selected={i === cursor}>
              <button
                className={`flex min-h-11 w-full items-center gap-2 px-3 text-left text-sm ${i === cursor ? 'bg-border' : ''}`}
                onMouseEnter={() => setCursor(i)}
                onClick={() => pick(i)}
              >
                <span style={{ color: CATEGORY_BY_ID[m.category]?.color }}>{CATEGORY_BY_ID[m.category]?.glyph}</span>
                <span className="truncate">{m.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{CATEGORY_BY_ID[m.category]?.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
