import { toast } from 'sonner'
import { MARKER_BY_ID } from '../data/loadMarkers'
import { track } from '../lib/analytics'
import { useProgress } from '../store/progress'
import { useUi } from '../store/ui'

export function toggleWithUndo(id: string) {
  const { toggle, setCompleted } = useProgress.getState()
  const done = toggle(id)
  // Checking an item off dismisses its dialog; the toast below still offers Undo. (Un-checking keeps it open.)
  const ui = useUi.getState()
  if (done && ui.selectedId === id) ui.select(null)
  // A finished marker's route is no longer needed on the map.
  if (done && ui.pathId === id) ui.hidePath()
  const marker = MARKER_BY_ID.get(id)
  track(done ? 'marker_completed' : 'marker_uncompleted', { category: marker?.category ?? 'unknown' })
  const name = marker?.name ?? id
  // Completing a shrine also completes everything linked to it (its shrine quest and treasure).
  // Undo puts those back as they were.
  const linkedIds =
    done && id.startsWith('shrine:')
      ? (marker?.details ?? [])
          .map((d) => d.marker)
          .filter((m): m is string => !!m && !(m in useProgress.getState().completed))
      : []
  linkedIds.forEach((l) => setCompleted(l, true))
  toast(done ? `Checked off ${name}` : `Unchecked ${name}`, {
    duration: 4000,
    action: {
      label: 'Undo',
      onClick: () => {
        setCompleted(id, !done)
        linkedIds.forEach((l) => setCompleted(l, false))
      },
    },
  })
}
