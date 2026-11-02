import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'
import type { MarkerId } from '../types/marker'

export const STORAGE_KEY = 'hyrule-tracker:v1'
export const STORAGE_VERSION = 1

export interface ProgressData {
  /** markerId -> epoch ms when completed */
  completed: Record<MarkerId, number>
  notes: Record<MarkerId, string>
  lastExportedAt: number | null
  changesSinceExport: number
}

interface ProgressState extends ProgressData {
  toggle: (id: MarkerId) => boolean
  setCompleted: (id: MarkerId, done: boolean) => void
  setNote: (id: MarkerId, note: string) => void
  replaceAll: (data: Pick<ProgressData, 'completed' | 'notes'>) => void
  mergeIn: (data: Pick<ProgressData, 'completed' | 'notes'>) => void
  markExported: () => void
  reset: () => void
}

export const EMPTY_PROGRESS: ProgressData = {
  completed: {},
  notes: {},
  lastExportedAt: null,
  changesSinceExport: 0,
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...EMPTY_PROGRESS,
      toggle: (id) => {
        const done = !(id in get().completed)
        get().setCompleted(id, done)
        return done
      },
      setCompleted: (id, done) =>
        set((s) => {
          const completed = { ...s.completed }
          if (done) completed[id] = Date.now()
          else delete completed[id]
          return { completed, changesSinceExport: s.changesSinceExport + 1 }
        }),
      setNote: (id, note) =>
        set((s) => {
          const notes = { ...s.notes }
          if (note.trim()) notes[id] = note
          else delete notes[id]
          return { notes, changesSinceExport: s.changesSinceExport + 1 }
        }),
      replaceAll: ({ completed, notes }) =>
        set((s) => ({ completed, notes, changesSinceExport: s.changesSinceExport + 1 })),
      mergeIn: ({ completed, notes }) =>
        set((s) => ({
          completed: { ...completed, ...s.completed },
          notes: { ...notes, ...s.notes },
          changesSinceExport: s.changesSinceExport + 1,
        })),
      markExported: () => set({ lastExportedAt: Date.now(), changesSinceExport: 0 }),
      reset: () => set({ ...EMPTY_PROGRESS }),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: safeStorage,
      partialize: (s) => ({
        completed: s.completed,
        notes: s.notes,
        lastExportedAt: s.lastExportedAt,
        changesSinceExport: s.changesSinceExport,
      }),
      migrate: (persisted) => ({ ...EMPTY_PROGRESS, ...(persisted as Partial<ProgressData>) }),
    },
  ),
)
