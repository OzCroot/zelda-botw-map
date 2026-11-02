import { useState } from 'react'
import { CATEGORY_BY_ID } from '@/data/categories'
import { cn } from '@/lib/utils'

/** The same artwork the map pins use (svg → png → coloured glyph), so filters look like what they control. */
export function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const c = CATEGORY_BY_ID[id]
  const [ext, setExt] = useState<'svg' | 'png' | null>(c?.icon ? 'svg' : null)
  if (!c) return null
  if (ext && c.icon)
    return (
      <img
        src={`/icons/${c.icon}.${ext}`}
        alt=""
        draggable={false}
        onError={() => setExt(ext === 'svg' ? 'png' : null)}
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
