import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CATEGORIES } from '@/data/categories'
import { REGIONS } from '@/data/loadMarkers'
import { countDone, getGroups } from '@/lib/tracked'
import { useProgress } from '@/store/progress'
import { useUi } from '@/store/ui'

function Bar({
  label,
  done,
  total,
  color,
}: {
  label: string
  done: number
  total: number
  color?: string
}) {
  const pct = total ? Math.round((done / total) * 100) : 0
  return (
    <Progress
      value={pct}
      aria-label={label}
      indicatorColor={color}
      trackClassName="h-2"
      className="gap-1"
    >
      <span className="text-sm">{label}</span>
      <span className="ml-auto text-sm text-muted-foreground tabular-nums">
        {done}/{total} · {pct}%
      </span>
    </Progress>
  )
}

export function StatsDashboard() {
  const completed = useProgress((s) => s.completed)
  const setRegion = useUi((s) => s.setRegion)
  const setTab = useUi((s) => s.setTab)
  const { items, byCategory, byRegion } = getGroups()
  const doneItems = countDone(items, completed)

  return (
    <div className="space-y-6">
      <Card size="sm">
        <CardContent className="text-center">
          <div className="text-4xl font-bold tabular-nums">
            {items.length ? Math.round((doneItems / items.length) * 100) : 0}%
          </div>
          <div className="text-sm text-muted-foreground">
            {doneItems} of {items.length} tracked items complete
          </div>
        </CardContent>
      </Card>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          By category
        </h3>
        {CATEGORIES.filter((c) => c.checkable).map((c) => {
          const all = byCategory.get(c.id) ?? []
          return (
            <Bar
              key={c.id}
              label={c.label}
              color={c.color}
              total={all.length}
              done={countDone(all, completed)}
            />
          )
        })}
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          By region
        </h3>
        {REGIONS.map((r) => {
          const all = byRegion.get(r.id)
          if (!all?.length) return null
          return (
            <button
              key={r.id}
              className="block w-full rounded-md text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              onClick={() => {
                setRegion(r.id)
                setTab('list')
              }}
            >
              <Bar label={r.label} total={all.length} done={countDone(all, completed)} />
            </button>
          )
        })}
        <p className="text-xs text-muted-foreground">Tap a region to see what's left there.</p>
      </section>
    </div>
  )
}
