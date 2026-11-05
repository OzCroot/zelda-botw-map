import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { MARKERS, usingSampleData } from '@/data/loadMarkers'
import {
  buildCsv,
  buildExport,
  diffImport,
  download,
  parseExport,
  type ImportDiff,
  type ProgressExport,
} from '@/lib/exportImport'
import { track } from '@/lib/analytics'
import { once } from '@/lib/once'
import { decodeProgress, encodeProgress } from '@/lib/shareCode'
import { useProgress } from '@/store/progress'
import { eraseAllLocalData, MAX_SAVES, useSaves } from '@/store/saves'
import { SavesSection } from './SavesSection'

const getIds = once(() => MARKERS.map((m) => m.id))

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </h3>
  )
}

export function DataMenu() {
  const {
    completed,
    notes,
    lastExportedAt,
    changesSinceExport,
    markExported,
    replaceAll,
    mergeIn,
    reset,
  } = useProgress()
  const activeName = useSaves((s) => s.slots[s.activeId]?.name ?? 'this save')
  const createSave = useSaves((s) => s.create)
  const saveCount = useSaves((s) => s.order.length)
  const atLimit = saveCount >= MAX_SAVES
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
    track('progress_imported', { mode })
    if (mode === 'merge') mergeIn(payload)
    else replaceAll(payload)
    setPending(null)
    toast.success(mode === 'merge' ? 'Progress merged' : 'Progress replaced')
  }

  // Keep what is in the file as its own save, leaving the current one untouched.
  const importAsNew = () => {
    if (!pending) return
    if (atLimit) return toast.error(`You can have up to ${MAX_SAVES} saves. Delete one first.`)
    createSave(`Imported ${new Date().toLocaleDateString()}`, {
      completed: pending.data.completed,
      notes: pending.data.notes,
    })
    track('progress_imported', { mode: 'new_save' })
    toast.dismiss()
    toast.success('Imported as a new save')
    setPending(null)
  }

  return (
    <div className="space-y-10 pb-4">
      {usingSampleData && (
        <Alert>
          <AlertDescription>
            Showing the bundled <b>sample dataset</b>. See the README to load real markers.
          </AlertDescription>
        </Alert>
      )}

      <SavesSection />

      <section className="space-y-3">
        <Heading>Export</Heading>
        <p className="text-xs text-muted-foreground">
          Exports “{activeName}”. A file is your backup: saves live only in this browser.{' '}
          {lastExportedAt
            ? `Last export ${new Date(lastExportedAt).toLocaleString()}.`
            : 'You have never exported.'}
          {changesSinceExport > 0 &&
            ` ${changesSinceExport} change${changesSinceExport > 1 ? 's' : ''} since.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              track('progress_exported', { format: 'json' })
              download(
                `hyrule-tracker-${stamp}.json`,
                JSON.stringify(buildExport({ completed, notes }), null, 2),
                'application/json',
              )
              markExported()
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              track('progress_exported', { format: 'csv' })
              download(`hyrule-tracker-${stamp}.csv`, buildCsv({ completed, notes }), 'text/csv')
            }}
          >
            Export CSV
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <Heading>Import</Heading>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => e.target.files?.[0] && readFile(e.target.files[0])}
        />
        <div
          className="grid min-h-24 cursor-pointer place-items-center rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50"
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
          <Card size="sm">
            <CardContent className="space-y-3 text-sm">
              <p>
                File has <b>{pending.diff.incoming}</b> completed items:{' '}
                <b>{pending.diff.newlyCompleted}</b> new, {pending.diff.alreadyCompleted} already
                done
                {pending.diff.unknown > 0 && `, ${pending.diff.unknown} not in this dataset`}.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={importAsNew} disabled={atLimit}>
                  Add as new save
                </Button>
                <Button variant="outline" onClick={() => apply('merge')}>
                  Merge into “{activeName}”
                </Button>
                <Button variant="outline" onClick={() => apply('replace')}>
                  Replace “{activeName}”
                </Button>
                {atLimit && (
                  <p className="w-full text-xs text-muted-foreground">
                    You have the maximum of {MAX_SAVES} saves, so this can't be added as a new one.
                    Delete a save first, or merge or replace instead.
                  </p>
                )}
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <Heading>Share code</Heading>
        <p className="text-xs text-muted-foreground">
          A short code for moving progress between devices (notes not included). Loading replaces “
          {activeName}”.
        </p>
        <Textarea
          className="font-mono text-xs"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste a code to load…"
          aria-label="Share code"
        />
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              track('share_code_generated')
              const c = encodeProgress(getIds(), new Set(Object.keys(completed)))
              setCode(c)
              navigator.clipboard?.writeText(c).then(() => toast('Code copied'))
            }}
          >
            Generate &amp; copy
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const done = decodeProgress(getIds(), code)
              if (!done) return toast.error('Invalid code for this dataset')
              track('share_code_loaded')
              const now = Date.now()
              replaceAll({
                completed: Object.fromEntries(done.map((id) => [id, completed[id] ?? now])),
                notes,
              })
              toast.success(`Loaded ${done.length} completed items`)
            }}
          >
            Load code
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <Heading>Danger zone</Heading>
        <div className="space-y-3 rounded-xl bg-destructive/5 p-4">
          <p className="text-xs text-muted-foreground">
            Clear the completed items and notes of “{activeName}”. The save itself and your other
            saves stay.
          </p>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Reset this save’s progress
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Erase progress in “{activeName}”?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes every completed item and note from this save. Your other saves are
                  not affected. Export first if you're unsure — it can't be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my progress</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => {
                    reset()
                    toast('Progress reset')
                  }}
                >
                  Erase progress
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="space-y-3 rounded-xl bg-destructive/5 p-4">
          <p className="text-xs text-muted-foreground">
            Clear everything this site stores in this browser: every save, plus your filters and
            settings. The app reloads as if it were your first visit.
          </p>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="destructive" />}>
              Erase all data on this device
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Erase all saved data?</AlertDialogTitle>
                <AlertDialogDescription>
                  This deletes all {saveCount} save{saveCount === 1 ? '' : 's'} and your settings
                  from this browser. It can't be undone. Export each save first if you want to keep
                  it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep my data</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={eraseAllLocalData}>
                  Erase everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </section>
    </div>
  )
}
