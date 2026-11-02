import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CATEGORIES, CATEGORY_GROUPS } from '@/data/categories'
import { MARKERS, REGIONS } from '@/data/loadMarkers'
import { useProgress } from '@/store/progress'
import { PRESETS, useUi } from '@/store/ui'

const totals: Record<string, number> = {}
for (const m of MARKERS) totals[m.category] = (totals[m.category] ?? 0) + 1

const REGION_ITEMS = [
  { value: 'all', label: 'All of Hyrule' },
  ...REGIONS.map((r) => ({ value: r.id, label: r.label })),
]

export function CategoryFilters() {
  const {
    enabled,
    toggleCategory,
    soloCategory,
    setAll,
    applyPreset,
    hideCompleted,
    setHideCompleted,
    region,
    setRegion,
  } = useUi()
  const completed = useProgress((s) => s.completed)
  const done: Record<string, number> = {}
  for (const m of MARKERS) if (m.id in completed) done[m.category] = (done[m.category] ?? 0) + 1

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <Button key={p.label} variant="outline" size="sm" className="rounded-full" onClick={() => applyPreset(p.ids)}>
            {p.label}
          </Button>
        ))}
        <Button variant="outline" size="sm" className="rounded-full" onClick={() => setAll(false)}>
          Clear
        </Button>
      </div>

      <Label htmlFor="hide-completed" className="min-h-11 gap-3 text-sm md:min-h-8">
        <Checkbox
          id="hide-completed"
          checked={hideCompleted}
          onCheckedChange={(c) => setHideCompleted(c === true)}
        />
        Hide completed
      </Label>

      <div className="space-y-1.5 text-sm">
        <Label>Region</Label>
        <Select
          items={REGION_ITEMS}
          value={region ?? 'all'}
          onValueChange={(v) => setRegion(!v || v === 'all' ? null : v)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGION_ITEMS.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {CATEGORY_GROUPS.map((g) => (
        <section key={g}>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{g}</h3>
          <ul>
            {CATEGORIES.filter((c) => c.group === g).map((c) => (
              <li key={c.id} className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  aria-pressed={enabled[c.id]}
                  onClick={() => toggleCategory(c.id)}
                  className={`h-11 flex-1 justify-start gap-3 px-2 ${enabled[c.id] ? '' : 'opacity-40'}`}
                >
                  <span
                    className="grid size-7 place-items-center rounded-full text-sm"
                    style={{ background: c.color, color: '#0f172a' }}
                    aria-hidden
                  >
                    {c.glyph}
                  </span>
                  <span className="flex-1 text-left">{c.label}</span>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {c.checkable ? `${done[c.id] ?? 0}/${totals[c.id] ?? 0}` : (totals[c.id] ?? 0)}
                  </span>
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  className="text-muted-foreground"
                  onClick={() => soloCategory(c.id)}
                  aria-label={`Show only ${c.label}`}
                >
                  only
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
