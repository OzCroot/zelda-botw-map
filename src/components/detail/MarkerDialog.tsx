import { Check, ExternalLink, Link2, MapPin } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CATEGORY_BY_ID } from '@/data/categories'
import { CategoryIcon } from '../map/CategoryIcon'
import { MARKER_BY_ID, REGION_BY_ID } from '@/data/loadMarkers'
import { useSeedHint } from '@/data/seedHints'
import { toggleWithUndo } from '@/hooks/useToggleWithUndo'
import { useProgress } from '@/store/progress'
import { useUi } from '@/store/ui'

/** A detail value with some of its words linked to wiki pages, which open in a new tab. */
function LinkedText({ text, links }: { text: string; links?: { name: string; url: string }[] }) {
  const parts: React.ReactNode[] = []
  let rest = text
  for (const { name, url } of links ?? []) {
    const at = rest.indexOf(name)
    if (at === -1) continue
    if (at > 0) parts.push(rest.slice(0, at))
    parts.push(
      <a
        key={`${url}:${parts.length}`}
        href={url}
        target="_blank"
        rel="noreferrer"
        className="underline decoration-dotted underline-offset-4 hover:text-primary"
      >
        {name}
      </a>,
    )
    rest = rest.slice(at + name.length)
  }
  if (rest) parts.push(rest)
  return <>{parts}</>
}

/**
 * A detail row that points at another marker (a shrine's quest, a chest's shrine…). Opens that marker's dialog and
 * reveals it on the map, switching its category and sub-group filters on if they were hiding it.
 */
function MarkerLink({ id, children }: { id: string; children: React.ReactNode }) {
  const target = MARKER_BY_ID.get(id)
  if (!target) return <>{children}</>
  return (
    <button
      type="button"
      title={`Show ${target.name} on the map`}
      className="inline-flex items-center gap-1 rounded text-left underline decoration-dotted underline-offset-4 outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-ring/50"
      onClick={() => {
        const { reveal, select } = useUi.getState()
        const { enabledCategory } = reveal(id)
        select(id)
        if (enabledCategory) toast(`Showing ${CATEGORY_BY_ID[target.category]?.label ?? 'it'}`)
      }}
    >
      {children}
      <MapPin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
    </button>
  )
}

/** Local-only screenshot: public/images/korok/webp/<seed number>.webp. Hidden if the file isn't there. */
function SeedImage({ markerId, alt }: { markerId: string; alt: string }) {
  const num = /Seed(\d+)$/.exec(markerId)?.[1]
  const [failed, setFailed] = useState<string | null>(null)
  if (!num || failed === num) return null
  return (
    <img
      key={num}
      src={`/images/korok/webp/${num}.webp`}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(num)}
      className="aspect-video w-full rounded-lg border border-border bg-muted object-cover"
    />
  )
}

/** Opens whenever a marker is selected (map pin, list row, search result or ?m= deep link). */
export function MarkerDialog() {
  const id = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)
  const done = useProgress((s) => (id ? id in s.completed : false))
  const completedAt = useProgress((s) => (id ? s.completed[id] : undefined))

  const m = id ? MARKER_BY_ID.get(id) : undefined
  const cat = m ? CATEGORY_BY_ID[m.category] : undefined
  const hint = useSeedHint(m?.id)
  const region = m?.region ? (REGION_BY_ID[m.region]?.label ?? m.region) : undefined

  return (
    <Dialog open={!!m} onOpenChange={(open) => !open && select(null)}>
      <DialogContent className="sm:max-w-md">
        {m && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 pr-8">
                <CategoryIcon id={m.category} markerId={m.id} className="size-10" />
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base">{m.name}</DialogTitle>
                  <DialogDescription>
                    {cat?.label}
                    {region ? ` · ${region}` : ''}
                  </DialogDescription>
                  {m.blessing && (
                    <p className="mt-0.5 text-sm text-muted-foreground italic">{m.blessing}</p>
                  )}
                </div>
              </div>
              {(m.tags?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {m.tags!.map((t) => (
                    <Badge key={t} variant="secondary">
                      {t}
                    </Badge>
                  ))}
                </div>
              )}
            </DialogHeader>

            {m.category === 'korok-seed' && (
              <SeedImage markerId={m.id} alt={`Where to find ${m.name}`} />
            )}

            {hint ? (
              <dl className="space-y-2.5 text-sm">
                {(hint.location || m.description) && (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Where
                    </dt>
                    <dd>
                      {hint.location ?? m.description}
                      {hint.location && m.description && (
                        <span className="text-muted-foreground"> · near {m.description}</span>
                      )}
                    </dd>
                  </div>
                )}
                {hint.puzzle && (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Puzzle
                    </dt>
                    <dd>{hint.puzzle}</dd>
                  </div>
                )}
              </dl>
            ) : (
              m.description && <p className="text-sm text-muted-foreground">{m.description}</p>
            )}

            {m.details && m.details.length > 0 && (
              <dl className="space-y-2.5 text-sm">
                {m.details.map((d) => (
                  <div key={d.label}>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {d.label}
                    </dt>
                    <dd>
                      {d.marker ? (
                        <MarkerLink id={d.marker}>{d.value}</MarkerLink>
                      ) : (
                        <LinkedText text={d.value} links={d.links} />
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {cat?.checkable && (
              <Button
                size="lg"
                variant={done ? 'outline' : 'default'}
                className="w-full"
                onClick={() => toggleWithUndo(m.id)}
              >
                <Check data-icon="inline-start" />
                {done ? 'Completed — tap to undo' : 'Mark complete'}
              </Button>
            )}
            {done && completedAt && (
              <p className="-mt-2 text-center text-xs text-muted-foreground">
                Completed {new Date(completedAt).toLocaleDateString()}
              </p>
            )}

            <DialogFooter className="sm:justify-start">
              <Button
                variant="outline"
                onClick={() =>
                  navigator.clipboard.writeText(location.href).then(() => toast('Link copied'))
                }
              >
                <Link2 data-icon="inline-start" /> Copy link
              </Button>
              {m.wikiUrl && (
                <Button
                  variant="outline"
                  render={<a href={m.wikiUrl} target="_blank" rel="noreferrer" />}
                >
                  <ExternalLink data-icon="inline-start" /> Wiki
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
