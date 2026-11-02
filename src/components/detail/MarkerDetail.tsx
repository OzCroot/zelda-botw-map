import { Check, ExternalLink, Link2, X } from 'lucide-react'
import { toast } from 'sonner'
import { CATEGORY_BY_ID } from '../../data/categories'
import { MARKER_BY_ID } from '../../data/loadMarkers'
import { REGION_BY_ID } from '../../data/regions'
import { toggleWithUndo } from '../../hooks/useToggleWithUndo'
import { useProgress } from '../../store/progress'
import { useUi } from '../../store/ui'

export function MarkerDetail() {
  const id = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)
  const done = useProgress((s) => (id ? id in s.completed : false))
  const note = useProgress((s) => (id ? (s.notes[id] ?? '') : ''))
  const setNote = useProgress((s) => s.setNote)
  const m = id ? MARKER_BY_ID.get(id) : undefined
  if (!m) return null
  const cat = CATEGORY_BY_ID[m.category]

  return (
    <div className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full" style={{ background: cat?.color, color: '#0f172a' }}>
          {cat?.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold">{m.name}</h2>
          <p className="text-xs text-muted">
            {cat?.label}
            {m.region ? ` · ${REGION_BY_ID[m.region]?.label ?? m.region}` : ''}
          </p>
        </div>
        <button className="icon-btn" aria-label="Close details" onClick={() => select(null)}>
          <X size={18} />
        </button>
      </div>
      {m.description && <p className="mt-3 text-sm text-muted">{m.description}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {cat?.checkable && (
          <button className={`btn ${done ? 'btn-done' : 'btn-primary'}`} onClick={() => toggleWithUndo(m.id)}>
            <Check size={16} /> {done ? 'Completed' : 'Mark complete'}
          </button>
        )}
        <button
          className="btn"
          onClick={() => navigator.clipboard.writeText(location.href).then(() => toast('Link copied'))}
        >
          <Link2 size={16} /> Copy link
        </button>
        {m.wikiUrl && (
          <a className="btn" href={m.wikiUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={16} /> Wiki
          </a>
        )}
      </div>
      <textarea
        className="field mt-3 min-h-16"
        placeholder="Add a note…"
        value={note}
        onChange={(e) => setNote(m.id, e.target.value)}
      />
    </div>
  )
}
