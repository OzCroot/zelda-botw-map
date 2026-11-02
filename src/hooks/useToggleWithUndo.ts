import { toast } from 'sonner'
import { MARKER_BY_ID } from '../data/loadMarkers'
import { useProgress } from '../store/progress'
import { useUi } from '../store/ui'

export function toggleWithUndo(id: string) {
  const { toggle, setCompleted } = useProgress.getState()
  const done = toggle(id)
  // Checking an item off dismisses its dialog; the toast below still offers Undo. (Un-checking keeps it open.)
  const ui = useUi.getState()
  if (done && ui.selectedId === id) ui.select(null)
  const name = MARKER_BY_ID.get(id)?.name ?? id
  toast(done ? `Checked off ${name}` : `Unchecked ${name}`, {
    duration: 4000,
    action: { label: 'Undo', onClick: () => setCompleted(id, !done) },
  })
}
