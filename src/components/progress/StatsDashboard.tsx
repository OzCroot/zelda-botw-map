import { CATEGORIES } from '../../data/categories'
import { MARKERS, REGIONS } from '../../data/loadMarkers'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'

function Bar({ label, done, total, color }: { label: string; done: number; total: number; color?: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted tabular-nums">
          {done}/{total} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color ?? 'var(--color-accent)' }} />
      </div>
    </div>
  )
}

export function StatsDashboard() {
  const completed = useProgress((s) => s.completed)
  const setRegion = useUi((s) => s.setRegion)
  const setTab = useUi((s) => s.setTab)
  const checkable = new Set(CATEGORIES.filter((c) => c.checkable).map((c) => c.id))
  const items = MARKERS.filter((m) => checkable.has(m.category))
  const doneItems = items.filter((m) => m.id in completed)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-line bg-card p-4 text-center">
        <div className="text-4xl font-bold tabular-nums">
          {items.length ? Math.round((doneItems.length / items.length) * 100) : 0}%
        </div>
        <div className="text-sm text-muted">
          {doneItems.length} of {items.length} tracked items complete
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">By category</h3>
        {CATEGORIES.filter((c) => c.checkable).map((c) => {
          const all = items.filter((m) => m.category === c.id)
          return <Bar key={c.id} label={c.label} color={c.color} total={all.length} done={all.filter((m) => m.id in completed).length} />
        })}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted uppercase">By region</h3>
        {REGIONS.map((r) => {
          const all = items.filter((m) => m.region === r.id)
          if (!all.length) return null
          return (
            <button
              key={r.id}
              className="block w-full text-left"
              onClick={() => {
                setRegion(r.id)
                setTab('list')
              }}
            >
              <Bar label={r.label} total={all.length} done={all.filter((m) => m.id in completed).length} />
            </button>
          )
        })}
        <p className="text-xs text-muted">Tap a region to see what's left there.</p>
      </section>
    </div>
  )
}
