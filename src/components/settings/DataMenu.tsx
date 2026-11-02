import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { MARKERS, usingSampleData } from '../../data/loadMarkers'
import {
  buildCsv,
  buildExport,
  diffImport,
  download,
  parseExport,
  type ImportDiff,
  type ProgressExport,
} from '../../lib/exportImport'
import { decodeProgress, encodeProgress } from '../../lib/shareCode'
import { useProgress } from '../../store/progress'

const ids = MARKERS.map((m) => m.id)

export function DataMenu() {
  const { completed, notes, lastExportedAt, changesSinceExport, markExported, replaceAll, mergeIn, reset } =
    useProgress()
  const [pending, setPending] = useState<{ data: ProgressExport; diff: ImportDiff } | null>(null)
  const [code, setCode] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const stamp = new Date().toISOString().slice(0, 10)

  const readFile = async (file: File) => {
    const r = parseExport(await file.text())
    if (!r.ok) return toast.error(r.error)
    setPending({ data: r.data, diff: diffImport({ completed }, r.data) })
  }

  const apply = (mode: 'merge' | 'replace') => {
    if (!pending) return
    const payload = { completed: pending.data.completed, notes: pending.data.notes }
    if (mode === 'merge') mergeIn(payload)
    else replaceAll(payload)
    setPending(null)
    toast.success(mode === 'merge' ? 'Progress merged' : 'Progress replaced')
  }

  return (
    <div className="space-y-6">
      {usingSampleData && (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
          Showing the bundled <b>sample dataset</b>. Run <code>npm run import-data</code> to load real markers (see README).
        </p>
      )}

      <section className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Export</h3>
        <p className="text-xs text-muted-foreground">
          Progress lives only in this browser.{' '}
          {lastExportedAt ? `Last export ${new Date(lastExportedAt).toLocaleString()}.` : 'You have never exported.'}
          {changesSinceExport > 0 && ` ${changesSinceExport} change${changesSinceExport > 1 ? 's' : ''} since.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary"
            onClick={() => {
              download(`hyrule-tracker-${stamp}.json`, JSON.stringify(buildExport({ completed, notes }), null, 2), 'application/json')
              markExported()
            }}
          >
            Export JSON
          </button>
          <button className="btn" onClick={() => download(`hyrule-tracker-${stamp}.csv`, buildCsv({ completed, notes }), 'text/csv')}>
            Export CSV
          </button>
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Import</h3>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])} />
        <div
          className="grid min-h-24 cursor-pointer place-items-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            const f = e.dataTransfer.files[0]
            if (f) readFile(f)
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileRef.current?.click()}
        >
          Drop an export file here, or tap to choose
        </div>
        {pending && (
          <div className="rounded-xl border border-border bg-card p-3 text-sm">
            <p>
              File has <b>{pending.diff.incoming}</b> completed items: <b>{pending.diff.newlyCompleted}</b> new,{' '}
              {pending.diff.alreadyCompleted} already done
              {pending.diff.unknown > 0 && `, ${pending.diff.unknown} not in this dataset`}.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button className="btn btn-primary" onClick={() => apply('merge')}>Merge</button>
              <button className="btn" onClick={() => apply('replace')}>Replace mine</button>
              <button className="btn" onClick={() => setPending(null)}>Cancel</button>
            </div>
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Share code</h3>
        <p className="text-xs text-muted-foreground">A short code for moving progress between devices (notes not included).</p>
        <textarea className="field min-h-16 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste a code to load…" />
        <div className="flex flex-wrap gap-2">
          <button
            className="btn"
            onClick={() => {
              const c = encodeProgress(ids, new Set(Object.keys(completed)))
              setCode(c)
              navigator.clipboard?.writeText(c).then(() => toast('Code copied'))
            }}
          >
            Generate &amp; copy
          </button>
          <button
            className="btn"
            onClick={() => {
              const done = decodeProgress(ids, code)
              if (!done) return toast.error('Invalid code for this dataset')
              const now = Date.now()
              replaceAll({ completed: Object.fromEntries(done.map((id) => [id, completed[id] ?? now])), notes })
              toast.success(`Loaded ${done.length} completed items`)
            }}
          >
            Load code
          </button>
        </div>
      </section>

      <section>
        <button
          className="btn text-red-400"
          onClick={() => {
            if (confirm('Erase all progress and notes from this browser? Export first if unsure.')) reset()
          }}
        >
          Reset all progress
        </button>
      </section>
    </div>
  )
}
