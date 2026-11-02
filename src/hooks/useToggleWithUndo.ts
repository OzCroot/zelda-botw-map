import { toast } from 'sonner'
import { MARKER_BY_ID } from '../data/loadMarkers'
import { useProgress } from '../store/progress'

export function toggleWithUndo(id: string) {
  const { toggle, setCompleted } = useProgress.getState()
  const done = toggle(id)
  const name = MARKER_BY_ID.get(id)?.name ?? id
  toast(done ? `Checked off ${name}` : `Unchecked ${name}`, {
    duration: 4000,
    action: { label: 'Undo', onClick: () => setCompleted(id, !done) },
  })
}
