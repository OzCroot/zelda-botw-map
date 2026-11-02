import { CATEGORIES, CATEGORY_GROUPS } from '../../data/categories'
import { MARKERS, REGIONS } from '../../data/loadMarkers'
import { PRESETS, useUi } from '../../store/ui'
import { useProgress } from '../../store/progress'

const totals: Record<string, number> = {}
for (const m of MARKERS) totals[m.category] = (totals[m.category] ?? 0) + 1

export function CategoryFilters() {
  const { enabled, toggleCategory, soloCategory, setAll, applyPreset, hideCompleted, setHideCompleted, region, setRegion } =
    useUi()
  const completed = useProgress((s) => s.completed)
  const done: Record<string, number> = {}
  for (const m of MARKERS) if (m.id in completed) done[m.category] = (done[m.category] ?? 0) + 1

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button key={p.label} className="chip" onClick={() => applyPreset(p.ids)}>
            {p.label}
          </button>
        ))}
        <button className="chip" onClick={() => setAll(false)}>
          Clear
        </button>
      </div>

      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="size-5 accent-sky-500"
          checked={hideCompleted}
          onChange={(e) => setHideCompleted(e.target.checked)}
        />
        Hide completed
      </label>

      <label className="block text-sm">
        <span className="mb-1 block text-muted">Region</span>
        <select
          className="field"
          value={region ?? ''}
          onChange={(e) => setRegion(e.target.value || null)}
        >
          <option value="">All of Hyrule</option>
          {REGIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      {CATEGORY_GROUPS.map((g) => (
        <section key={g}>
          <h3 className="mb-1 text-xs font-semibold tracking-wide text-muted uppercase">{g}</h3>
          <ul>
            {CATEGORIES.filter((c) => c.group === g).map((c) => (
              <li key={c.id} className="flex items-center">
                <button
                  aria-pressed={enabled[c.id]}
                  onClick={() => toggleCategory(c.id)}
                  className={`flex min-h-11 flex-1 items-center gap-3 rounded-lg px-2 text-left text-sm transition ${enabled[c.id] ? '' : 'opacity-40'}`}
                >
                  <span className="grid size-7 place-items-center rounded-full text-sm" style={{ background: c.color, color: '#0f172a' }}>
                    {c.glyph}
                  </span>
                  <span className="flex-1">{c.label}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {c.checkable ? `${done[c.id] ?? 0}/${totals[c.id] ?? 0}` : (totals[c.id] ?? 0)}
                  </span>
                </button>
                <button
                  className="min-h-11 px-3 text-xs text-muted hover:text-fg"
                  onClick={() => soloCategory(c.id)}
                  aria-label={`Show only ${c.label}`}
                >
                  only
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
