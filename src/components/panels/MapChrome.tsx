import { useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { MENU_MIN_WIDTH, useUi } from '@/store/ui'
import { PanelContent } from './PanelContent'
import { SearchBox } from './SearchBox'

function Hamburger({ open }: { open: boolean }) {
  const bar = 'absolute left-0 h-0.5 w-full rounded bg-current transition-transform duration-200 ease-[cubic-bezier(.2,.8,.2,1)]'
  return (
    <span className="relative block h-3.5 w-[18px]" aria-hidden>
      <span className={cn(bar, 'top-0', open && 'translate-y-[6px] rotate-45')} />
      <span className={cn(bar, 'top-[6px]', open && 'scale-x-0')} />
      <span className={cn(bar, 'top-3', open && '-translate-y-[6px] -rotate-45')} />
    </span>
  )
}

const STEP = 24
const maxWidth = () => Math.max(MENU_MIN_WIDTH, Math.min(innerWidth * 0.75, 900))

/** Drag handle on the menu's right edge. Pointer-captured so the drag survives leaving the strip. */
function ResizeHandle() {
  const width = useUi((s) => s.menuWidth)
  const setWidth = useUi((s) => s.setMenuWidth)
  const drag = useRef<{ x: number; w: number } | null>(null)
  const clamp = (w: number) => Math.min(maxWidth(), Math.max(MENU_MIN_WIDTH, w))
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize menu"
      aria-valuemin={MENU_MIN_WIDTH}
      aria-valuemax={Math.round(maxWidth())}
      aria-valuenow={width}
      tabIndex={0}
      title="Drag to resize · double-click to reset"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId)
        drag.current = { x: e.clientX, w: width }
      }}
      onPointerMove={(e) => drag.current && setWidth(clamp(drag.current.w + e.clientX - drag.current.x))}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onDoubleClick={() => setWidth(MENU_MIN_WIDTH)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') setWidth(clamp(width + STEP))
        else if (e.key === 'ArrowLeft') setWidth(clamp(width - STEP))
        else return
        e.preventDefault()
      }}
      className="group absolute inset-y-3 -right-2 z-10 hidden w-4 cursor-col-resize touch-none items-center justify-center outline-none sm:flex"
    >
      <span className="h-12 w-1 rounded-full bg-border transition-[background-color,height] duration-150 group-hover:h-16 group-hover:bg-primary/70 group-focus-visible:bg-primary group-active:bg-primary" />
    </div>
  )
}

/** Everything that floats over the map: menu button, search, theme, and the slide-over panel. */
export function MapChrome() {
  const menuOpen = useUi((s) => s.menuOpen)
  const setMenuOpen = useUi((s) => s.setMenuOpen)
  const menuWidth = useUi((s) => s.menuWidth)
  const tab = useUi((s) => s.tab)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName)) return
      if (e.key === 'f' || e.key === 'm') setMenuOpen(!useUi.getState().menuOpen)
      if (e.key === 'Escape') setMenuOpen(false)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [setMenuOpen])

  const glass = 'border border-border/70 bg-background/92 shadow-lg backdrop-blur-md'
  return (
    <>
      <div className="pointer-events-none absolute inset-x-3 top-3 z-[1000] flex items-start gap-2">
        <Button
          variant="ghost"
          size="icon-lg"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          aria-controls="map-menu"
          onClick={() => setMenuOpen(!menuOpen)}
          className={cn('pointer-events-auto size-11 rounded-xl', glass)}
        >
          <Hamburger open={menuOpen} />
        </Button>
        <div className="pointer-events-auto min-w-0 flex-1 sm:max-w-md sm:flex-none sm:basis-96">
          <SearchBox />
        </div>
      </div>

      {/* Slide-over: always mounted (keeps scroll/tab state), overlays the map, never resizes it. */}
      <aside
        id="map-menu"
        inert={!menuOpen}
        aria-hidden={!menuOpen}
        data-tab={tab}
        style={{ width: `min(${menuWidth}px, calc(100% - 1.5rem))` }}
        className={cn(
          'panel-surface absolute top-[3.75rem] bottom-3 left-3 z-[1000] origin-top-left rounded-2xl border border-border/70 p-3 shadow-lg',
          'transition-[opacity,transform] duration-[180ms] ease-[cubic-bezier(.2,.8,.2,1)] will-change-transform',
          menuOpen ? 'translate-x-0 scale-100 opacity-100' : 'pointer-events-none -translate-x-3 scale-[.97] opacity-0',
        )}
      >
        <PanelContent />
        <ResizeHandle />
      </aside>
    </>
  )
}
