import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { MapView } from './components/map/MapView'
import { BottomSheet } from './components/panels/BottomSheet'
import { PanelContent } from './components/panels/PanelContent'
import { toggleWithUndo } from './hooks/useToggleWithUndo'
import { useMedia } from './hooks/useMedia'
import { useUrlState } from './hooks/useUrlState'
import { CATEGORY_BY_ID } from './data/categories'
import { MARKER_BY_ID } from './data/loadMarkers'
import { useUi } from './store/ui'

export default function App() {
  const desktop = useMedia('(min-width: 768px)')
  const theme = useUi((s) => s.theme)
  useUrlState()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return
      const { selectedId, select } = useUi.getState()
      if (e.key === 'Escape') select(null)
      if (e.key === 'c' && selectedId && CATEGORY_BY_ID[MARKER_BY_ID.get(selectedId)?.category ?? '']?.checkable)
        toggleWithUndo(selectedId)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="flex h-dvh w-full">
      {desktop && (
        <aside className="z-[1000] w-[22rem] shrink-0 border-r border-line bg-panel p-4">
          <PanelContent />
        </aside>
      )}
      <main className="relative min-w-0 flex-1">
        <MapView />
      </main>
      {!desktop && <BottomSheet />}
      <Toaster position={desktop ? 'bottom-right' : 'top-center'} theme={theme} />
    </div>
  )
}
