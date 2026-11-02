import { useState } from 'react'
import { Drawer, DrawerContent, DrawerTitle } from '@/components/ui/drawer'
import { PanelContent } from './PanelContent'

// Peek (search + tabs), half, near-full.
const SNAPS: (string | number)[] = ['160px', 0.55, 0.94]

/** Mobile bottom sheet: non-modal so the map stays interactive behind it. */
export function BottomSheet() {
  const [snap, setSnap] = useState<string | number | null>(SNAPS[0]!)
  return (
    <Drawer open modal={false} snapPoints={SNAPS} snapPoint={snap} onSnapPointChange={setSnap} showSwipeHandle>
      <DrawerContent className="border-border bg-background" aria-describedby={undefined}>
        <DrawerTitle className="sr-only">Map controls</DrawerTitle>
        <div className="min-h-0 flex-1 px-4 pt-1 pb-[env(safe-area-inset-bottom)]">
          <PanelContent />
        </div>
      </DrawerContent>
    </Drawer>
  )
}
