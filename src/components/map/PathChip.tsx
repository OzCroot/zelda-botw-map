import { Route, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MARKER_BY_ID } from '@/data/loadMarkers'
import { useUi } from '@/store/ui'

/** Floats over the map while a route is shown, so it can be put away again without finding the marker. */
export function PathChip() {
  const pathId = useUi((s) => s.pathId)
  const hide = useUi((s) => s.hidePath)
  const select = useUi((s) => s.select)
  const m = pathId ? MARKER_BY_ID.get(pathId) : undefined
  if (!m) return null
  return (
    <div className="pointer-events-none absolute inset-x-3 bottom-4 z-[1000] flex justify-center sm:bottom-6">
      <div className="pointer-events-auto flex max-w-full items-center gap-1 rounded-full border border-border/70 bg-background/92 py-1 pr-1 pl-3 shadow-lg backdrop-blur-md">
        <Route className="size-4 shrink-0 text-[#b8975a]" aria-hidden />
        <button
          type="button"
          onClick={() => select(m.id)}
          className="min-w-0 truncate rounded px-1 text-sm font-medium outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
          title="Open details"
        >
          Path · {m.name}
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={hide}
          className="rounded-full"
          aria-label="Hide path"
        >
          <X data-icon="inline-start" /> Hide
        </Button>
      </div>
    </div>
  )
}
