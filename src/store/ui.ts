import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CATEGORIES } from '../data/categories'
import type { MarkerId } from '../types/marker'

export type Tab = 'filters' | 'list' | 'stats' | 'data'

interface UiState {
  enabled: Record<string, boolean>
  hideCompleted: boolean
  region: string | null
  tab: Tab
  selectedId: MarkerId | null
  query: string
  sheetOpen: boolean
  theme: 'dark' | 'light'
  toggleCategory: (id: string) => void
  soloCategory: (id: string) => void
  setAll: (on: boolean) => void
  applyPreset: (ids: string[]) => void
  setHideCompleted: (v: boolean) => void
  setRegion: (r: string | null) => void
  setTab: (t: Tab) => void
  select: (id: MarkerId | null) => void
  setQuery: (q: string) => void
  setSheetOpen: (v: boolean) => void
  toggleTheme: () => void
}

const allOn = Object.fromEntries(CATEGORIES.map((c) => [c.id, true]))

export const PRESETS: { label: string; ids: string[] }[] = [
  { label: 'Shrine hunt', ids: ['shrine', 'tower'] },
  { label: 'Korok run', ids: ['korok'] },
  { label: 'Story', ids: ['memory', 'beast', 'tower'] },
  { label: 'Everything', ids: CATEGORIES.map((c) => c.id) },
]

export const useUi = create<UiState>()(
  persist(
    (set) => ({
      enabled: allOn,
      hideCompleted: false,
      region: null,
      tab: 'filters',
      selectedId: null,
      query: '',
      sheetOpen: false,
      theme: 'dark',
      toggleCategory: (id) => set((s) => ({ enabled: { ...s.enabled, [id]: !s.enabled[id] } })),
      soloCategory: (id) =>
        set({ enabled: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.id === id])) }),
      setAll: (on) => set({ enabled: Object.fromEntries(CATEGORIES.map((c) => [c.id, on])) }),
      applyPreset: (ids) =>
        set({ enabled: Object.fromEntries(CATEGORIES.map((c) => [c.id, ids.includes(c.id)])) }),
      setHideCompleted: (hideCompleted) => set({ hideCompleted }),
      setRegion: (region) => set({ region }),
      setTab: (tab) => set({ tab }),
      select: (selectedId) => set(selectedId ? { selectedId, sheetOpen: true } : { selectedId }),
      setQuery: (query) => set({ query }),
      setSheetOpen: (sheetOpen) => set({ sheetOpen }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'hyrule-tracker:ui:v1',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ enabled: s.enabled, hideCompleted: s.hideCompleted, theme: s.theme }),
    },
  ),
)
