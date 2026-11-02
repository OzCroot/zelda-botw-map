import { useState } from 'react'
import { Drawer } from 'vaul'
import { PanelContent } from './PanelContent'

const SNAPS = ['120px', 0.55, 0.94]

export function BottomSheet() {
  const [snap, setSnap] = useState<string | number | null>(SNAPS[0]!)
  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={SNAPS}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
    >
      <Drawer.Portal>
        <Drawer.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-[1100] flex h-full max-h-[96%] flex-col rounded-t-2xl border-t border-border bg-background px-4 pt-2 shadow-2xl outline-none"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <Drawer.Title className="sr-only">Map controls</Drawer.Title>
          <div className="mx-auto mb-3 h-1.5 w-12 shrink-0 rounded-full bg-border" />
          <div className="min-h-0 flex-1">
            <PanelContent />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
