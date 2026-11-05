import { ChevronDown, EyeOff, MapPin, Shirt, Swords } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CATEGORIES, CATEGORY_GROUPS } from '@/data/categories'
import { FACET_BY_SET, SET_ORDER, facetKey } from '@/data/facets'
import { MARKERS, REGIONS } from '@/data/loadMarkers'
import { once } from '@/lib/once'
import { cn } from '@/lib/utils'
import { PRESETS, useUi } from '@/store/ui'
import { CategoryIcon } from '../map/CategoryIcon'

const isMaster = (m: { tags?: string[] }) => !!m.tags?.includes('Master Mode')
const masterCount = once(() => MARKERS.filter(isMaster).length)

// Counts per category, and per category+sub-group (region, or set for clothing), with and without Master Mode items.
function tally(master: boolean) {
  const totals: Record<string, number> = {}
  const byRegion: Record<string, Record<string, number>> = {}
  for (const m of MARKERS) {
    if (!master && isMaster(m)) continue
    totals[m.category] = (totals[m.category] ?? 0) + 1
    const key = facetKey(m)
    if (key) {
      const r = (byRegion[m.category] ??= {})
      r[key] = (r[key] ?? 0) + 1
    }
  }
  return { totals, byRegion }
}
const getCounts = once(() => ({ on: tally(true), off: tally(false) }))

const COLLAPSED_BY_DEFAULT = new Set(['Treasure', 'Enemies', 'Places', 'Map labels'])

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

/** Small pill for counts. */
function CountChip({ children, tone }: { children: React.ReactNode; tone?: 'primary' }) {
  return (
    <span
      className={cn(
        'inline-flex h-4 items-center rounded-full border px-1.5 text-[10px] leading-none font-medium tracking-normal whitespace-nowrap normal-case tabular-nums',
        tone === 'primary'
          ? 'border-primary/40 bg-primary/15 text-foreground'
          : 'border-border/70 bg-background/40 text-muted-foreground',
      )}
    >
      {children}
    </span>
  )
}

/** Compact on/off tile: icon, label, optional badge, and a small switch. */
function ToggleTile({
  on,
  onChange,
  icon: Icon,
  label,
  badge,
  hint,
}: {
  on: boolean
  onChange: (on: boolean) => void
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: React.ReactNode
  hint?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      title={hint}
      onClick={() => onChange(!on)}
      className={cn(
        'flex h-11 min-w-0 items-center gap-2 rounded-xl border px-3 text-left text-sm outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50',
        on ? 'border-primary/50 bg-primary/12' : 'border-border/70 bg-card/40 hover:bg-card/70',
      )}
    >
      <Icon className={cn('size-4 shrink-0', on ? 'text-primary' : 'text-muted-foreground')} />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge && <span className="shrink-0 text-[11px] text-muted-foreground tabular-nums">{badge}</span>}
      <span
        aria-hidden
        className={cn('relative h-[18px] w-8 shrink-0 rounded-full transition-colors', on ? 'bg-primary' : 'bg-muted-foreground/30')}
      >
        <span
          className={cn(
            'absolute top-0.5 left-0.5 size-3.5 rounded-full bg-white shadow transition-transform duration-150',
            on && 'translate-x-3.5',
          )}
        />
      </span>
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
  const { totals, byRegion } = masterMode ? getCounts().on : getCounts().off
  const toggleCatRegion = useUi((s) => s.toggleCatRegion)
  const setCatRegions = useUi((s) => s.setCatRegions)
  const setEnabled = (ids: string[], on: boolean) =>
    useUi.setState((s) => ({ enabled: { ...s.enabled, ...Object.fromEntries(ids.map((i) => [i, on])) } }))

  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set(COLLAPSED_BY_DEFAULT))
  const groups = useMemo(
    () => CATEGORY_GROUPS.map((g) => ({ g, items: CATEGORIES.filter((c) => c.group === g) })),
    [],
  )

  return (
    <div className="space-y-6">
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

      <div className="space-y-2.5">
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

      <div className="grid grid-cols-[repeat(auto-fit,minmax(11.5rem,1fr))] gap-2">
        <ToggleTile icon={EyeOff} label="Hide completed" on={hideCompleted} onChange={setHideCompleted} />
        {masterCount() > 0 && (
          <ToggleTile
            icon={Swords}
            label="Master Mode"
            badge={`+${masterCount()}`}
            hint={`${masterCount()} extra weapons, gems and Lynels that only appear in Master Mode`}
            on={masterMode}
            onChange={setMasterMode}
          />
        )}
      </div>

      {groups.map(({ g, items }) => {
        const open = !collapsed.has(g)
        const ids = items.map((c) => c.id)
        const onCount = ids.filter((i) => enabled[i]).length
        return (
          <section key={g}>
            <div className="mb-2.5 flex items-center">
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
                <CountChip>
                  {onCount}/{ids.length}
                </CountChip>
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
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2">
                {items.map((c) => {
                  const regs = byRegion[c.id] ?? {}
                  // Sub-groups: the sets for clothing (people hunt it a set at a time), the regions otherwise.
                  const bySet = FACET_BY_SET.has(c.id)
                  const regIds = bySet ? SET_ORDER.filter((s) => regs[s]) : REGIONS.filter((r) => regs[r.id]).map((r) => r.id)
                  const noun = bySet ? 'sets' : 'areas'
                  const FacetIcon = bySet ? Shirt : MapPin
                  const canSplit = regIds.length > 1
                  const hidden = hiddenRegions[c.id] ?? []
                  const on = enabled[c.id]
                  return (
                    <li key={c.id} className="min-w-0">
                      <div
                        className={cn(
                          'flex h-12 items-center rounded-xl border transition-colors',
                          on ? 'border-primary/40 bg-card/80 shadow-sm' : 'border-border/50 bg-card/25 hover:bg-card/45',
                        )}
                      >
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleCategory(c.id)}
                          onDoubleClick={() => soloCategory(c.id)}
                          title={`${c.label} · click to toggle, double-click to show only this`}
                          className={cn(
                            'flex h-full min-w-0 flex-1 items-center gap-2 rounded-xl pl-2 text-left text-[13px] outline-none transition-[opacity,filter] focus-visible:ring-3 focus-visible:ring-ring/50',
                            !on && 'opacity-50 grayscale hover:opacity-80',
                          )}
                        >
                          <CategoryIcon id={c.id} className="size-7 shrink-0" />
                          <span className="min-w-0 flex-1 leading-tight">
                            <span className="block truncate">{c.label}</span>
                            <span className="mt-0.5 flex items-center gap-1">
                              <CountChip>{totals[c.id] ?? 0}</CountChip>
                              {hidden.length > 0 && (
                                <CountChip tone="primary">
                                  {regIds.length - hidden.length}/{regIds.length} {noun}
                                </CountChip>
                              )}
                            </span>
                          </span>
                        </button>
                        {canSplit ? (
                          <Popover>
                            <PopoverTrigger
                              aria-label={`${c.label} by ${bySet ? 'set' : 'area'}`}
                              className={cn(
                                'mr-1 grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:bg-accent/60 data-popup-open:text-foreground',
                                hidden.length > 0 && 'text-primary',
                              )}
                            >
                              <ChevronDown className="size-4" />
                            </PopoverTrigger>
                            <PopoverContent>
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                  <FacetIcon className="size-3.5" /> {c.label}
                                </span>
                                <button
                                  type="button"
                                  className="rounded px-1 text-xs text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    if (!on) setEnabled([c.id], true)
                                    setCatRegions(c.id, hidden.length ? [] : regIds)
                                  }}
                                >
                                  {hidden.length ? `All ${noun}` : 'None'}
                                </button>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {regIds.map((rid) => (
                                  <Chip
                                    key={rid}
                                    on={!hidden.includes(rid)}
                                    onClick={() => {
                                      if (!on) setEnabled([c.id], true)
                                      toggleCatRegion(c.id, rid)
                                    }}
                                  >
                                    {bySet ? rid : REGIONS.find((r) => r.id === rid)?.label}{' '}
                                    <span className="opacity-60 tabular-nums">{regs[rid]}</span>
                                  </Chip>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        ) : (
                          <span className="w-2 shrink-0" aria-hidden />
                        )}
                      </div>
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
