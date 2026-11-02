import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CATEGORIES } from '@/data/categories'
import { MARKERS, REGIONS } from '@/data/loadMarkers'
import { once } from '@/lib/once'
import { useProgress } from '@/store/progress'
import { useUi } from '@/store/ui'
import type { Marker } from '@/types/marker'

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

// The tracked items never change, so group them once instead of re-filtering ~3.7k markers per bar on every render.
const getGroups = once(() => {
  const checkable = new Set(CATEGORIES.filter((c) => c.checkable).map((c) => c.id))
  const items = MARKERS.filter((m) => checkable.has(m.category))
  const byCategory = new Map<string, Marker[]>()
  const byRegion = new Map<string, Marker[]>()
  for (const m of items) {
    push(byCategory, m.category, m)
    if (m.region) push(byRegion, m.region, m)
  }
  return { items, byCategory, byRegion }
})

function push(map: Map<string, Marker[]>, key: string, m: Marker) {
  const list = map.get(key)
  if (list) list.push(m)
  else map.set(key, [m])
}

function countDone(list: Marker[], completed: Record<string, number>) {
  let n = 0
  for (const m of list) if (m.id in completed) n++
  return n
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
