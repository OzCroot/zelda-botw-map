import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { CATEGORIES, defaultEnabled } from '../data/categories'
import { MARKER_BY_ID } from '../data/loadMarkers'
import type { MarkerId } from '../types/marker'
import { useProgress } from './progress'

export type Tab = 'filters' | 'list' | 'stats' | 'data'

interface UiState {
  enabled: Record<string, boolean>
  hideCompleted: boolean
  region: string | null
  tab: Tab
  /** Marker whose details dialog is open. */
  selectedId: MarkerId | null
  /** Marker highlighted on the map (search result, last clicked pin). */
  focusId: MarkerId | null
  /** Bumped by reveal() to ask the map to fly to a marker. */
  flyTo: { id: MarkerId; n: number } | null
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
  /** Make a marker visible (adjusting filters if needed), fly to it and highlight it. */
  reveal: (id: MarkerId) => { enabledCategory: boolean }
  clearFocus: () => void
  setQuery: (q: string) => void
  setSheetOpen: (v: boolean) => void
  toggleTheme: () => void
}


export const PRESETS: { label: string; ids: string[] }[] = [
  { label: 'Shrine hunt', ids: ['shrine', 'sheikah-tower'] },
  { label: 'Korok run', ids: ['korok-seed'] },
  { label: 'Story', ids: ['main-quest', 'memory', 'sheikah-tower'] },
  { label: 'Treasure', ids: CATEGORIES.filter((c) => c.group === 'Treasure').map((c) => c.id) },
  { label: 'Everything', ids: CATEGORIES.map((c) => c.id) },
]

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      enabled: defaultEnabled(),
      hideCompleted: false,
      region: null,
      tab: 'filters',
      selectedId: null,
      focusId: null,
      flyTo: null,
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
      select: (selectedId) =>
        set(selectedId ? { selectedId, focusId: selectedId, sheetOpen: true } : { selectedId }),
      reveal: (id) => {
        const m = MARKER_BY_ID.get(id)
        if (!m) return { enabledCategory: false }
        const s = get()
        const enabledCategory = !s.enabled[m.category]
        set({
          focusId: id,
          flyTo: { id, n: (s.flyTo?.n ?? 0) + 1 },
          enabled: enabledCategory ? { ...s.enabled, [m.category]: true } : s.enabled,
          region: s.region && s.region !== m.region ? null : s.region,
          hideCompleted: s.hideCompleted && id in useProgress.getState().completed ? false : s.hideCompleted,
        })
        return { enabledCategory }
      },
      clearFocus: () => set({ focusId: null }),
      setQuery: (query) => set({ query }),
      setSheetOpen: (sheetOpen) => set({ sheetOpen }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'hyrule-tracker:ui:v1',
      storage: createJSONStorage(() => localStorage),
      merge: (p, cur) => ({
        ...cur,
        ...(p as object),
        enabled: { ...cur.enabled, ...((p as { enabled?: Record<string, boolean> })?.enabled ?? {}) },
      }),
      partialize: (s) => ({ enabled: s.enabled, hideCompleted: s.hideCompleted, theme: s.theme }),
    },
  ),
)
