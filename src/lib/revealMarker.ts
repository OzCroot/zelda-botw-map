import { toast } from 'sonner'
import { CATEGORY_BY_ID } from '../data/categories'
import { useUi } from '../store/ui'
import type { MarkerId } from '../types/marker'

/** Show a marker on the map (switching on whatever was hiding it) and tell the user if a filter was changed for it. */
export function revealMarker(id: MarkerId, categoryId: string) {
  const { enabledCategory, enabledMasterMode } = useUi.getState().reveal(id)
  if (enabledMasterMode) toast('Master Mode items are now shown')
  else if (enabledCategory) toast(`Showing ${CATEGORY_BY_ID[categoryId]?.label ?? 'category'} on the map`)
}
