import { ChevronDown, MapPin } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { CATEGORIES, CATEGORY_GROUPS } from '@/data/categories'
import { MARKERS, REGIONS } from '@/data/loadMarkers'
import { cn } from '@/lib/utils'
import { PRESETS, useUi } from '@/store/ui'
import { CategoryIcon } from '../map/CategoryIcon'

const isMaster = (m: { tags?: string[] }) => !!m.tags?.includes('Master Mode')
const MASTER_COUNT = MARKERS.filter(isMaster).length

// Counts per category, and per category+region, with and without Master Mode items.
function tally(master: boolean) {
  const totals: Record<string, number> = {}
  const byRegion: Record<string, Record<string, number>> = {}
  for (const m of MARKERS) {
    if (!master && isMaster(m)) continue
    totals[m.category] = (totals[m.category] ?? 0) + 1
    if (m.region) {
      const r = (byRegion[m.category] ??= {})
      r[m.region] = (r[m.region] ?? 0) + 1
    }
  }
  return { totals, byRegion }
}
const COUNTS = { on: tally(true), off: tally(false) }

const COLLAPSED_BY_DEFAULT = new Set(['Treasure', 'Enemies', 'Services', 'Places'])

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        'h-7 rounded-full border px-2.5 text-xs whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
        on
          ? 'border-primary/60 bg-primary/15 text-foreground'
          : 'border-border text-muted-foreground hover:bg-accent/60',
      )}
    >
      {children}
    </button>
  )
}

export function CategoryFilters() {
  const enabled = useUi((s) => s.enabled)
  const toggleCategory = useUi((s) => s.toggleCategory)
  const soloCategory = useUi((s) => s.soloCategory)
  const setAll = useUi((s) => s.setAll)
  const applyPreset = useUi((s) => s.applyPreset)
  const hideCompleted = useUi((s) => s.hideCompleted)
  const setHideCompleted = useUi((s) => s.setHideCompleted)
  const region = useUi((s) => s.region)
  const setRegion = useUi((s) => s.setRegion)
  const hiddenRegions = useUi((s) => s.hiddenRegions)
  const masterMode = useUi((s) => s.masterMode)
  const setMasterMode = useUi((s) => s.setMasterMode)
  const { totals, byRegion } = masterMode ? COUNTS.on : COUNTS.off
  const toggleCatRegion = useUi((s) => s.toggleCatRegion)
  const setCatRegions = useUi((s) => s.setCatRegions)
  const setEnabled = (ids: string[], on: boolean) =>
    useUi.setState((s) => ({ enabled: { ...s.enabled, ...Object.fromEntries(ids.map((i) => [i, on])) } }))

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(COLLAPSED_BY_DEFAULT))
  const [expanded, setExpanded] = useState<string | null>(null)
  const groups = useMemo(
    () => CATEGORY_GROUPS.map((g) => ({ g, items: CATEGORIES.filter((c) => c.group === g) })),
    [],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-1.5">
        {PRESETS.map((p) => (
          <Chip key={p.label} on={false} onClick={() => applyPreset(p.ids)}>
            {p.label}
          </Chip>
        ))}
        <Chip on={false} onClick={() => setAll(false)}>
          None
        </Chip>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          <MapPin className="size-3.5" /> Area
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip on={!region} onClick={() => setRegion(null)}>
            All
          </Chip>
          {REGIONS.map((r) => (
            <Chip key={r.id} on={region === r.id} onClick={() => setRegion(region === r.id ? null : r.id)}>
              {r.label}
            </Chip>
          ))}
        </div>
      </div>

      <Label htmlFor="hide-completed" className="min-h-8 gap-3 text-sm">
        <Checkbox id="hide-completed" checked={hideCompleted} onCheckedChange={(c) => setHideCompleted(c === true)} />
        Hide completed
      </Label>

      {MASTER_COUNT > 0 && (
        <Label htmlFor="master-mode" className="min-h-8 items-start gap-3 text-sm">
          <Checkbox
            id="master-mode"
            className="mt-0.5"
            checked={masterMode}
            onCheckedChange={(c) => setMasterMode(c === true)}
          />
          <span>
            Master Mode items
            <span className="block text-xs font-normal text-muted-foreground">
              {MASTER_COUNT} extra weapons, gems and Lynels that only appear in Master Mode
            </span>
          </span>
        </Label>
      )}

      {groups.map(({ g, items }) => {
        const open = !collapsed.has(g)
        const ids = items.map((c) => c.id)
        const onCount = ids.filter((i) => enabled[i]).length
        return (
          <section key={g}>
            <div className="mb-1.5 flex items-center">
              <button
                type="button"
                aria-expanded={open}
                onClick={() =>
                  setCollapsed((s) => {
                    const n = new Set(s)
                    if (n.has(g)) n.delete(g)
                    else n.add(g)
                    return n
                  })
                }
                className="flex flex-1 items-center gap-1.5 rounded text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ChevronDown className={cn('size-3.5 transition-transform duration-150', !open && '-rotate-90')} />
                {g}
                <span className="font-normal tabular-nums opacity-70">
                  {onCount}/{ids.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setEnabled(ids, onCount !== ids.length)}
                className="rounded px-1.5 py-0.5 text-xs text-muted-foreground hover:text-foreground"
              >
                {onCount === ids.length ? 'Hide all' : 'Show all'}
              </button>
            </div>
            {open && (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] gap-1">
                {items.map((c) => {
                  const regs = byRegion[c.id] ?? {}
                  const regIds = REGIONS.filter((r) => regs[r.id]).map((r) => r.id)
                  const canSplit = regIds.length > 1
                  const hidden = hiddenRegions[c.id] ?? []
                  const isOpen = expanded === c.id
                  return (
                    <li key={c.id} className={cn('flex min-w-0 flex-col', isOpen && 'col-span-full')}>
                      <div
                        className={cn(
                          'flex items-center rounded-lg border transition-colors',
                          enabled[c.id] ? 'border-border bg-card' : 'border-transparent',
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={enabled[c.id]}
                          onClick={() => toggleCategory(c.id)}
                          onDoubleClick={() => soloCategory(c.id)}
                          title="Click to toggle · double-click to show only this"
                          className={cn(
                            'flex min-h-10 min-w-0 flex-1 items-center gap-2 rounded-lg px-1.5 text-left text-sm outline-none transition-[opacity,filter] focus-visible:ring-3 focus-visible:ring-ring/50',
                            !enabled[c.id] && 'opacity-45 grayscale hover:opacity-75',
                          )}
                        >
                          <CategoryIcon id={c.id} className="size-7" />
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="line-clamp-2 break-words">{c.label}</span>
                            <span className="block text-[11px] text-muted-foreground tabular-nums">
                              {totals[c.id] ?? 0}
                              {hidden.length > 0 && ` · ${regIds.length - hidden.length} areas`}
                            </span>
                          </span>
                        </button>
                        {canSplit && (
                          <button
                            type="button"
                            aria-label={`${c.label} by area`}
                            aria-expanded={isOpen}
                            onClick={() => setExpanded(isOpen ? null : c.id)}
                            className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
                          >
                            <ChevronDown className={cn('size-4 transition-transform duration-150', isOpen && 'rotate-180')} />
                          </button>
                        )}
                      </div>
                      {isOpen && (
                        <div className="mt-1 mb-1 flex flex-wrap gap-1.5 rounded-lg bg-muted/50 p-2">
                          {regIds.map((rid) => (
                            <Chip key={rid} on={!hidden.includes(rid)} onClick={() => {
                              if (!enabled[c.id]) setEnabled([c.id], true)
                              toggleCatRegion(c.id, rid)
                            }}>
                              {REGIONS.find((r) => r.id === rid)?.label}{' '}
                              <span className="opacity-60 tabular-nums">{regs[rid]}</span>
                            </Chip>
                          ))}
                          <button
                            type="button"
                            className="px-1 text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => setCatRegions(c.id, hidden.length ? [] : regIds)}
                          >
                            {hidden.length ? 'All areas' : 'None'}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </section>
        )
      })}
    </div>
  )
}
