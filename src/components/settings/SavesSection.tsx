import { Check, Copy, Ellipsis, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { countDone, getGroups, percent } from '@/lib/tracked'
import { useProgress } from '@/store/progress'
import { cleanName, MAX_NAME_LENGTH, MAX_SAVES, useSaves, type SaveSlot } from '@/store/saves'

type DialogState =
  { kind: 'new' } | { kind: 'rename'; id: string } | { kind: 'delete'; id: string } | null

const fmt = new Intl.NumberFormat()
const day = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short' })

function lastActivity(completed: Record<string, number>) {
  let t = 0
  for (const at of Object.values(completed)) if (at > t) t = at
  return t
}

/** Name prompt shared by "New save" and "Rename". Mounted fresh each time it opens, so the field always starts clean. */
function NameDialog({
  title,
  description,
  initial,
  confirmLabel,
  onSubmit,
  onClose,
}: {
  title: string
  description: string
  initial: string
  confirmLabel: string
  onSubmit: (name: string) => void
  onClose: () => void
}) {
  const [name, setName] = useState(initial)
  const valid = cleanName(name).length > 0
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (valid) onSubmit(name)
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={name}
            maxLength={MAX_NAME_LENGTH}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            placeholder="e.g. Master Mode run"
            aria-label="Save name"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!valid}>
              {confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function SaveCard({
  slot,
  active,
  canDelete,
  atLimit,
  onRename,
  onDelete,
}: {
  slot: SaveSlot
  active: boolean
  canDelete: boolean
  atLimit: boolean
  onRename: () => void
  onDelete: () => void
}) {
  const switchTo = useSaves((s) => s.switchTo)
  const duplicate = useSaves((s) => s.duplicate)
  const live = useProgress((s) => s.completed)
  const [menu, setMenu] = useState(false)

  // The active save is read live; the others from what was stored when they were switched away from.
  const completed = active ? live : (slot.data?.completed ?? {})
  const { items } = getGroups()
  const done = countDone(items, completed)
  const pct = percent(done, items.length)
  const last = lastActivity(completed)

  return (
    <li
      className={`rounded-xl border p-3 ${active ? 'border-primary/60 bg-primary/10' : 'border-border/70 bg-card/40'}`}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-medium">{slot.name}</span>
        {active && (
          <Badge variant="secondary" className="shrink-0">
            <Check data-icon="inline-start" /> Active
          </Badge>
        )}
        <Popover open={menu} onOpenChange={setMenu}>
          <PopoverTrigger
            render={
              <Button variant="ghost" size="icon-sm" aria-label={`Options for ${slot.name}`} />
            }
          >
            <Ellipsis />
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1">
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => {
                setMenu(false)
                onRename()
              }}
            >
              <Pencil data-icon="inline-start" /> Rename
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start"
              disabled={atLimit}
              onClick={() => {
                setMenu(false)
                if (duplicate(slot.id)) toast.success(`Copied “${slot.name}”`)
              }}
            >
              <Copy data-icon="inline-start" />{' '}
              {atLimit ? 'Duplicate (limit reached)' : 'Duplicate'}
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive"
              disabled={!canDelete}
              onClick={() => {
                setMenu(false)
                onDelete()
              }}
            >
              <Trash2 data-icon="inline-start" /> {canDelete ? 'Delete' : 'Delete (last save)'}
            </Button>
          </PopoverContent>
        </Popover>
      </div>

      <Progress
        value={pct}
        aria-label={`${slot.name} progress`}
        className="mt-2 gap-1"
        trackClassName="h-1.5"
      >
        <span className="text-xs text-muted-foreground tabular-nums">
          {fmt.format(done)} of {fmt.format(items.length)} · {pct}%
        </span>
        <span className="ml-auto text-xs text-muted-foreground">
          {last ? `Last checked off ${day.format(last)}` : 'No progress yet'}
        </span>
      </Progress>

      {!active && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => {
            toast.dismiss() // an "Undo" toast from the previous save would act on this one
            switchTo(slot.id)
            toast.success(`Switched to “${slot.name}”`)
          }}
        >
          Switch to this save
        </Button>
      )}
    </li>
  )
}

export function SavesSection() {
  const { order, slots, activeId, create, rename, remove } = useSaves()
  const [dialog, setDialog] = useState<DialogState>(null)
  const close = () => setDialog(null)
  const atLimit = order.length >= MAX_SAVES
  const target = dialog && dialog.kind !== 'new' ? slots[dialog.id] : undefined
  const targetDone = target
    ? countDone(
        getGroups().items,
        target.id === activeId ? useProgress.getState().completed : (target.data?.completed ?? {}),
      )
    : 0

  return (
    <section className="space-y-3">
      <div className="space-y-1">
        <h3 className="flex items-baseline justify-between text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Saves
          <span className="font-normal tracking-normal normal-case tabular-nums">
            {order.length} of {MAX_SAVES}
          </span>
        </h3>
        <p className="text-xs text-muted-foreground">
          Progress is saved automatically in this browser. Keep a separate save for each
          playthrough, such as a Master Mode run, and switch between them here. Filters and settings
          are shared.
        </p>
      </div>

      <ul className="space-y-2">
        {order.map((id) => {
          const slot = slots[id]
          return slot ? (
            <SaveCard
              key={id}
              slot={slot}
              active={id === activeId}
              canDelete={order.length > 1}
              atLimit={atLimit}
              onRename={() => setDialog({ kind: 'rename', id })}
              onDelete={() => setDialog({ kind: 'delete', id })}
            />
          ) : null
        })}
      </ul>

      <Button
        variant="outline"
        className="w-full"
        disabled={atLimit}
        onClick={() => setDialog({ kind: 'new' })}
      >
        <Plus data-icon="inline-start" /> New save
      </Button>
      {atLimit && (
        <p className="text-xs text-muted-foreground">
          You've reached the limit of {MAX_SAVES} saves. Delete one to add another.
        </p>
      )}

      {dialog?.kind === 'new' && (
        <NameDialog
          title="New save"
          description="Starts empty and becomes the active save. Your current save is kept as it is."
          initial=""
          confirmLabel="Create save"
          onClose={close}
          onSubmit={(name) => {
            const id = create(name)
            toast.dismiss()
            if (id) toast.success(`Started “${useSaves.getState().slots[id]?.name}”`)
            else toast.error(`You can have up to ${MAX_SAVES} saves. Delete one first.`)
            close()
          }}
        />
      )}
      {dialog?.kind === 'rename' && target && (
        <NameDialog
          title="Rename save"
          description="Only the name changes; progress is untouched."
          initial={target.name}
          confirmLabel="Rename"
          onClose={close}
          onSubmit={(name) => {
            rename(target.id, name)
            close()
          }}
        />
      )}
      {dialog?.kind === 'delete' && target && (
        <AlertDialog open onOpenChange={(open) => !open && close()}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete “{target.name}”?</AlertDialogTitle>
              <AlertDialogDescription>
                {targetDone > 0
                  ? `This removes ${fmt.format(targetDone)} completed item${targetDone === 1 ? '' : 's'} and any notes in this save.`
                  : 'This save has no completed items.'}{' '}
                {target.id === activeId && 'You will be switched to another save. '}It can't be
                undone, so export first if you're unsure.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep it</AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  toast.dismiss()
                  if (remove(target.id)) toast(`Deleted “${target.name}”`)
                  close()
                }}
              >
                Delete save
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </section>
  )
}
