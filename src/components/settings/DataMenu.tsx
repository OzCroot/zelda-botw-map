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
import { Separator } from '@/components/ui/separator'
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
import { decodeProgress, encodeProgress } from '@/lib/shareCode'
import { useProgress } from '@/store/progress'

const ids = MARKERS.map((m) => m.id)

function Heading({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{children}</h3>
}

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
        <Alert>
          <AlertDescription>
            Showing the bundled <b>sample dataset</b>. See the README to load real markers.
          </AlertDescription>
        </Alert>
      )}

      <section className="space-y-2">
        <Heading>Export</Heading>
        <p className="text-xs text-muted-foreground">
          Progress lives only in this browser.{' '}
          {lastExportedAt ? `Last export ${new Date(lastExportedAt).toLocaleString()}.` : 'You have never exported.'}
          {changesSinceExport > 0 && ` ${changesSinceExport} change${changesSinceExport > 1 ? 's' : ''} since.`}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              download(`hyrule-tracker-${stamp}.json`, JSON.stringify(buildExport({ completed, notes }), null, 2), 'application/json')
              markExported()
            }}
          >
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => download(`hyrule-tracker-${stamp}.csv`, buildCsv({ completed, notes }), 'text/csv')}
          >
            Export CSV
          </Button>
        </div>
      </section>

      <Separator />

      <section className="space-y-2">
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
                File has <b>{pending.diff.incoming}</b> completed items: <b>{pending.diff.newlyCompleted}</b> new,{' '}
                {pending.diff.alreadyCompleted} already done
                {pending.diff.unknown > 0 && `, ${pending.diff.unknown} not in this dataset`}.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => apply('merge')}>Merge</Button>
                <Button variant="outline" onClick={() => apply('replace')}>
                  Replace mine
                </Button>
                <Button variant="ghost" onClick={() => setPending(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </section>

      <Separator />

      <section className="space-y-2">
        <Heading>Share code</Heading>
        <p className="text-xs text-muted-foreground">A short code for moving progress between devices (notes not included).</p>
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
              const c = encodeProgress(ids, new Set(Object.keys(completed)))
              setCode(c)
              navigator.clipboard?.writeText(c).then(() => toast('Code copied'))
            }}
          >
            Generate &amp; copy
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const done = decodeProgress(ids, code)
              if (!done) return toast.error('Invalid code for this dataset')
              const now = Date.now()
              replaceAll({ completed: Object.fromEntries(done.map((id) => [id, completed[id] ?? now])), notes })
              toast.success(`Loaded ${done.length} completed items`)
            }}
          >
            Load code
          </Button>
        </div>
      </section>

      <Separator />

      <section>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>Reset all progress</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Erase all progress?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes every completed item and note from this browser. Export first if you're unsure — it can't be
                undone.
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
                Erase everything
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>
    </div>
  )
}
