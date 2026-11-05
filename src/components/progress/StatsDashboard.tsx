import { CheckIcon, ChevronDownIcon } from 'lucide-react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import type { ReactNode } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CHECKABLE_CATEGORIES } from '@/data/categories'
import { REGIONS } from '@/data/loadMarkers'
import { countDone, getGroups, percent } from '@/lib/tracked'
import { useProgress } from '@/store/progress'
import { cn } from '@/lib/utils'
import { useUi } from '@/store/ui'

function Bar({
  label,
  done,
  total,
  color,
  small,
  trailing,
}: {
  label: string
  done: number
  total: number
  color?: string
  /** Quieter styling for rows nested under another bar. */
  small?: boolean
  trailing?: ReactNode
}) {
  const pct = percent(done, total)
  const complete = total > 0 && done === total
  return (
    <Progress
      value={pct}
      aria-label={label}
      indicatorColor={color}
      trackClassName={small ? 'h-1.5' : 'h-2'}
      className="gap-1"
    >
      <span
        className={cn(
          'flex items-center gap-1.5',
          small ? 'text-xs text-muted-foreground' : 'text-sm',
        )}
      >
        {label}
        {complete && <CheckIcon aria-label="Complete" className="size-3.5 text-emerald-400" />}
      </span>
      <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        {done}/{total} · {pct}%{trailing}
      </span>
    </Progress>
  )
}

/** Neutral on purpose: region bars measure everything in the region, so they must not borrow a category colour. */
const REGION_BAR = 'color-mix(in oklab, var(--foreground) 65%, transparent)'

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
            {percent(doneItems, items.length)}%
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
        {CHECKABLE_CATEGORIES.map((c) => {
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
        <Accordion className="gap-1">
          {REGIONS.map((r) => {
            const all = byRegion.get(r.id)
            if (!all?.length) return null
            const done = countDone(all, completed)
            const complete = done === all.length
            return (
              <AccordionItem
                key={r.id}
                value={r.id}
                className="rounded-lg transition-colors hover:bg-muted/40 has-[[data-panel-open]]:bg-muted/40"
              >
                <AccordionTrigger chevron={false} className="items-center px-2 py-2.5">
                  <Bar
                    label={r.label}
                    total={all.length}
                    done={done}
                    color={REGION_BAR}
                    trailing={
                      <ChevronDownIcon className="size-4 transition-transform duration-200 group-data-[panel-open]/accordion-trigger:rotate-180" />
                    }
                  />
                </AccordionTrigger>
                <AccordionContent className="px-2 pb-3">
                  <div className="ml-1 space-y-2.5 border-l border-border pl-3">
                    {CHECKABLE_CATEGORIES.map((c) => {
                      const inCategory = all.filter((m) => m.category === c.id)
                      if (!inCategory.length) return null
                      return (
                        <Bar
                          key={c.id}
                          small
                          label={c.label}
                          color={c.color}
                          total={inCategory.length}
                          done={countDone(inCategory, completed)}
                        />
                      )
                    })}
                    {!complete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="-ml-2 text-muted-foreground"
                        onClick={() => {
                          setRegion(r.id)
                          setTab('list')
                        }}
                      >
                        See what's left in {r.label} →
                      </Button>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </section>
    </div>
  )
}
