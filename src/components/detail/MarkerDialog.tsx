import { Check, ExternalLink, Link2 } from 'lucide-react'
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
                <CategoryIcon id={m.category} className="size-10" />
                <div className="min-w-0">
                  <DialogTitle className="truncate text-base">{m.name}</DialogTitle>
                  <DialogDescription>
                    {cat?.label}
                    {region ? ` · ${region}` : ''}
                  </DialogDescription>
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

            {m.category === 'korok-seed' && <SeedImage markerId={m.id} alt={`Where to find ${m.name}`} />}

            {hint ? (
              <dl className="space-y-2.5 text-sm">
                {(hint.location || m.description) && (
                  <div>
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Where</dt>
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
                    <dt className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Puzzle</dt>
                    <dd>{hint.puzzle}</dd>
                  </div>
                )}
              </dl>
            ) : (
              m.description && <p className="text-sm text-muted-foreground">{m.description}</p>
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
                <Button variant="outline" render={<a href={m.wikiUrl} target="_blank" rel="noreferrer" />}>
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
