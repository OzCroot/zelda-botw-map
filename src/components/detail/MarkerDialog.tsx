import { Check, ExternalLink, Link2 } from 'lucide-react'
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
import { Textarea } from '@/components/ui/textarea'
import { CATEGORY_BY_ID } from '@/data/categories'
import { MARKER_BY_ID, REGION_BY_ID } from '@/data/loadMarkers'
import { toggleWithUndo } from '@/hooks/useToggleWithUndo'
import { useProgress } from '@/store/progress'
import { useUi } from '@/store/ui'

/** Opens whenever a marker is selected (map pin, list row, search result or ?m= deep link). */
export function MarkerDialog() {
  const id = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)
  const done = useProgress((s) => (id ? id in s.completed : false))
  const completedAt = useProgress((s) => (id ? s.completed[id] : undefined))
  const note = useProgress((s) => (id ? (s.notes[id] ?? '') : ''))
  const setNote = useProgress((s) => s.setNote)

  const m = id ? MARKER_BY_ID.get(id) : undefined
  const cat = m ? CATEGORY_BY_ID[m.category] : undefined
  const region = m?.region ? (REGION_BY_ID[m.region]?.label ?? m.region) : undefined

  return (
    <Dialog open={!!m} onOpenChange={(open) => !open && select(null)}>
      <DialogContent className="sm:max-w-md">
        {m && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3 pr-8">
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full text-lg"
                  style={{ background: cat?.color, color: '#0f172a' }}
                  aria-hidden
                >
                  {cat?.glyph}
                </span>
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

            {m.description && <p className="text-sm text-muted-foreground">{m.description}</p>}

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

            <Textarea
              aria-label="Notes"
              placeholder="Add a note…"
              value={note}
              onChange={(e) => setNote(m.id, e.target.value)}
            />

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
