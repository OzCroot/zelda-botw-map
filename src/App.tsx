import { useEffect } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { MarkerDialog } from './components/detail/MarkerDialog'
import { MapView } from './components/map/MapView'
import { PathChip } from './components/map/PathChip'
import { MapChrome } from './components/panels/MapChrome'
import { toggleWithUndo } from './hooks/useToggleWithUndo'
import { useUrlState } from './hooks/useUrlState'
import { CATEGORY_BY_ID } from './data/categories'
import { MARKER_BY_ID } from './data/loadMarkers'
import { isShortcut } from './lib/keys'
import { useUi } from './store/ui'

export default function App() {
  const theme = useUi((s) => s.theme)
  useUrlState()

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!isShortcut(e)) return
      const { selectedId, select } = useUi.getState()
      if (e.key === 'Escape') select(null)
      if (
        e.key === 'c' &&
        selectedId &&
        CATEGORY_BY_ID[MARKER_BY_ID.get(selectedId)?.category ?? '']?.checkable
      )
        toggleWithUndo(selectedId)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      <MapView />
      <MapChrome />
      <PathChip />
      <MarkerDialog />
      <Toaster position="bottom-center" />
    </div>
  )
}
