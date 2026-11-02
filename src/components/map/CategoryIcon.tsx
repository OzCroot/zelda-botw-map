import { useState } from 'react'
import { CATEGORY_BY_ID, iconScale } from '@/data/categories'
import { cn } from '@/lib/utils'
import { iconSrc, markPng } from './icons'

/** The same artwork the map pins use (svg → png → coloured glyph), so filters look like what they control. */
export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const c = CATEGORY_BY_ID[id]
  const [failed, setFailed] = useState(false)
  const [, retry] = useState(0)
  if (!c) return null
  if (c.icon && !failed)
    return (
      <img
        src={iconSrc(c.icon)}
        alt=""
        draggable={false}
        style={{ transform: `scale(${iconScale(c.icon)})` }}
        onError={(e) => {
          // .svg missing: iconSrc now points at the .png; that missing too: fall back to the glyph.
          if (e.currentTarget.src.endsWith('.svg') && c.icon) {
            markPng(c.icon)
            retry((n) => n + 1)
          } else setFailed(true)
        }}
        className={cn('size-8 shrink-0 object-contain', className)}
      />
    )
  return (
    <span
      className={cn('grid size-8 shrink-0 place-items-center rounded-full text-sm', className)}
      style={{ background: c.color, color: '#0f172a' }}
      aria-hidden
    >
      {c.glyph}
    </span>
  )
}
