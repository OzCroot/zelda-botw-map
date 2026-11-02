import { toast } from 'sonner'
import { MARKER_BY_ID } from '../data/loadMarkers'
import { useProgress } from '../store/progress'
import { useUi } from '../store/ui'

export function toggleWithUndo(id: string) {
  const { toggle, setCompleted } = useProgress.getState()
  const done = toggle(id)
  // With "Hide completed" on, a finished item should vanish right away rather than sit behind its own dialog.
  // (The toast below still offers Undo.)
  const ui = useUi.getState()
  if (done && ui.hideCompleted && ui.selectedId === id) ui.select(null)
  const name = MARKER_BY_ID.get(id)?.name ?? id
  toast(done ? `Checked off ${name}` : `Unchecked ${name}`, {
    duration: 4000,
    action: { label: 'Undo', onClick: () => setCompleted(id, !done) },
  })
}
