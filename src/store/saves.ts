import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'
import { EMPTY_PROGRESS, STORAGE_KEY, useProgress, type ProgressData } from './progress'
import { UI_STORAGE_KEY } from './ui'

export const SAVES_KEY = 'hyrule-tracker:saves:v1'
export const MAX_NAME_LENGTH = 30
/** Each save is up to ~100 KB in localStorage, so this keeps well inside the browser's ~5 MB quota. */
export const MAX_SAVES = 5
export const DEFAULT_SAVE_ID = 'main'

export interface SaveSlot {
  id: string
  name: string
  createdAt: number
  /**
   * The slot's progress while it is NOT the active save. The active save lives in useProgress (which is what the
   * rest of the app reads and writes), so this is null for it and any stored copy would be stale.
   */
  data: ProgressData | null
}

type Progress = Pick<ProgressData, 'completed' | 'notes'>

interface SavesState {
  activeId: string
  /** Display order. */
  order: string[]
  slots: Record<string, SaveSlot>
  /** Add a save and switch to it. Returns its id, or null if the limit is reached. */
  create: (name: string, initial?: Progress) => string | null
  switchTo: (id: string) => void
  rename: (id: string, name: string) => void
  /** Copy a save (without switching to the copy). Returns the copy's id, or null if the limit is reached. */
  duplicate: (id: string) => string | null
  /** Delete a save. Refuses to delete the last one. Deleting the active save switches to a neighbour first. */
  remove: (id: string) => boolean
}

export const initialSaves = () => ({
  activeId: DEFAULT_SAVE_ID,
  order: [DEFAULT_SAVE_ID],
  slots: {
    [DEFAULT_SAVE_ID]: { id: DEFAULT_SAVE_ID, name: 'My game', createdAt: Date.now(), data: null },
  },
})

const snapshot = (): ProgressData => {
  const { completed, notes, lastExportedAt, changesSinceExport } = useProgress.getState()
  return { completed, notes, lastExportedAt, changesSinceExport }
}

export const cleanName = (name: string) =>
  name.trim().replace(/\s+/g, ' ').slice(0, MAX_NAME_LENGTH)

/** "Name", or "Name (2)", "Name (3)"… so two saves never look the same in the list. */
function uniqueName(name: string, taken: string[], skip?: string) {
  const lower = new Set(taken.filter((n) => n !== skip).map((n) => n.toLowerCase()))
  const base = cleanName(name) || 'New save'
  let candidate = base
  for (let n = 2; lower.has(candidate.toLowerCase()); n++) {
    const suffix = ` (${n})`
    candidate = base.slice(0, MAX_NAME_LENGTH - suffix.length) + suffix
  }
  return candidate
}

const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`

export const useSaves = create<SavesState>()(
  persist(
    (set, get) => {
      const names = (skipId?: string) =>
        Object.values(get().slots)
          .filter((s) => s.id !== skipId)
          .map((s) => s.name)

      return {
        ...initialSaves(),

        create: (name, initial) => {
          if (get().order.length >= MAX_SAVES) return null
          const id = newId()
          const slot: SaveSlot = {
            id,
            name: uniqueName(name, names()),
            createdAt: Date.now(),
            data: { ...EMPTY_PROGRESS, ...initial },
          }
          set((s) => ({ slots: { ...s.slots, [id]: slot }, order: [...s.order, id] }))
          get().switchTo(id)
          return id
        },

        switchTo: (id) => {
          const { activeId, slots } = get()
          const target = slots[id]
          if (id === activeId || !target) return
          // Order matters if anything interrupts this: the registry is written first, so the outgoing save's
          // progress is stored before the live state is replaced, and nothing can be lost.
          set({
            activeId: id,
            slots: {
              ...slots,
              [activeId]: { ...slots[activeId]!, data: snapshot() },
              [id]: { ...target, data: null },
            },
          })
          useProgress.setState({ ...EMPTY_PROGRESS, ...target.data })
        },

        rename: (id, name) =>
          set((s) => {
            const slot = s.slots[id]
            if (!slot) return s
            return { slots: { ...s.slots, [id]: { ...slot, name: uniqueName(name, names(id)) } } }
          }),

        duplicate: (id) => {
          const { slots, activeId } = get()
          const source = slots[id]
          if (!source || get().order.length >= MAX_SAVES) return null
          const copyId = newId()
          const data = id === activeId ? snapshot() : (source.data ?? EMPTY_PROGRESS)
          const copy: SaveSlot = {
            id: copyId,
            name: uniqueName(`${source.name} copy`, names()),
            createdAt: Date.now(),
            data: { ...data, lastExportedAt: null, changesSinceExport: 0 },
          }
          set((s) => {
            const at = s.order.indexOf(id) + 1
            return {
              slots: { ...s.slots, [copyId]: copy },
              order: [...s.order.slice(0, at), copyId, ...s.order.slice(at)],
            }
          })
          return copyId
        },

        remove: (id) => {
          const { order, activeId } = get()
          if (order.length <= 1 || !order.includes(id)) return false
          if (id === activeId) {
            const i = order.indexOf(id)
            get().switchTo(order[i + 1] ?? order[i - 1]!)
          }
          set((s) => {
            const { [id]: _gone, ...slots } = s.slots
            return { slots, order: s.order.filter((o) => o !== id) }
          })
          return true
        },
      }
    },
    {
      name: SAVES_KEY,
      version: 1,
      storage: safeStorage,
      partialize: (s) => ({ activeId: s.activeId, order: s.order, slots: s.slots }),
    },
  ),
)

/** Remove everything this app keeps in the browser (all saves, progress, and settings), then reload. */
export function eraseAllLocalData() {
  for (const key of [STORAGE_KEY, SAVES_KEY, UI_STORAGE_KEY]) localStorage.removeItem(key)
  location.reload()
}
