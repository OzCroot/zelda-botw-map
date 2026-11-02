import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { safeStorage } from '../lib/safeStorage'
import { CATEGORIES, defaultEnabled } from '../data/categories'
import { MARKER_BY_ID } from '../data/loadMarkers'
import type { MarkerId } from '../types/marker'
import { useProgress } from './progress'

/** Narrowest the menu can be (23rem at 16px): the original fixed width. */
export const MENU_MIN_WIDTH = 368

export type Tab = 'filters' | 'list' | 'stats' | 'data'

interface UiState {
  enabled: Record<string, boolean>
  hideCompleted: boolean
  /** Show markers that only exist in Master Mode (tagged "Master Mode"). Off by default. */
  masterMode: boolean
  region: string | null
  tab: Tab
  /** Marker whose details dialog is open. */
  selectedId: MarkerId | null
  /** Marker highlighted on the map (search result, last clicked pin). */
  focusId: MarkerId | null
  /** Bumped by reveal() to ask the map to fly to a marker. */
  flyTo: { id: MarkerId; n: number } | null
  query: string
  /** Floating menu (filters / list / progress / data) is open. */
  menuOpen: boolean
  /** User-dragged menu width in px (desktop). */
  menuWidth: number
  /** Per-category list of region ids hidden for that category. */
  hiddenRegions: Record<string, string[]>
  theme: 'dark' | 'light'
  toggleCategory: (id: string) => void
  soloCategory: (id: string) => void
  setAll: (on: boolean) => void
  applyPreset: (ids: string[]) => void
  setHideCompleted: (v: boolean) => void
  setMasterMode: (v: boolean) => void
  setRegion: (r: string | null) => void
  setTab: (t: Tab) => void
  select: (id: MarkerId | null) => void
  /** Make a marker visible (adjusting filters if needed), fly to it and highlight it. */
  reveal: (id: MarkerId) => { enabledCategory: boolean; enabledMasterMode: boolean }
  clearFocus: () => void
  setQuery: (q: string) => void
  setMenuOpen: (v: boolean) => void
  setMenuWidth: (w: number) => void
  toggleCatRegion: (cat: string, region: string) => void
  setCatRegions: (cat: string, hidden: string[]) => void
  toggleTheme: () => void
}

export const PRESETS: { label: string; ids: string[] }[] = [
  { label: 'Shrine hunt', ids: ['shrine', 'shrine-dlc', 'sheikah-tower'] },
  { label: 'Korok run', ids: ['korok-seed'] },
  { label: 'Story', ids: ['main-quest', 'memory', 'sheikah-tower'] },
  { label: 'Treasure', ids: CATEGORIES.filter((c) => c.group === 'Treasure').map((c) => c.id) },
  { label: 'Everything', ids: CATEGORIES.map((c) => c.id) },
]

export const UI_STORAGE_KEY = 'hyrule-tracker:ui:v1'

export const useUi = create<UiState>()(
  persist(
    (set, get) => ({
      enabled: defaultEnabled(),
      hideCompleted: false,
      masterMode: false,
      region: null,
      tab: 'filters',
      selectedId: null,
      focusId: null,
      flyTo: null,
      query: '',
      menuOpen: false,
      menuWidth: MENU_MIN_WIDTH,
      hiddenRegions: {},
      theme: 'dark',
      toggleCategory: (id) => set((s) => ({ enabled: { ...s.enabled, [id]: !s.enabled[id] } })),
      soloCategory: (id) =>
        set({ enabled: Object.fromEntries(CATEGORIES.map((c) => [c.id, c.id === id])) }),
      setAll: (on) => set({ enabled: Object.fromEntries(CATEGORIES.map((c) => [c.id, on])) }),
      applyPreset: (ids) =>
        set({ enabled: Object.fromEntries(CATEGORIES.map((c) => [c.id, ids.includes(c.id)])) }),
      setHideCompleted: (hideCompleted) => set({ hideCompleted }),
      setMasterMode: (masterMode) => set({ masterMode }),
      setRegion: (region) => set({ region }),
      setTab: (tab) => set({ tab }),
      select: (selectedId) =>
        set(selectedId ? { selectedId, focusId: selectedId } : { selectedId }),
      reveal: (id) => {
        const m = MARKER_BY_ID.get(id)
        if (!m) return { enabledCategory: false, enabledMasterMode: false }
        const s = get()
        const enabledCategory = !s.enabled[m.category]
        const enabledMasterMode = !!m.tags?.includes('Master Mode') && !s.masterMode
        set({
          focusId: id,
          masterMode: s.masterMode || enabledMasterMode,
          flyTo: { id, n: (s.flyTo?.n ?? 0) + 1 },
          enabled: enabledCategory ? { ...s.enabled, [m.category]: true } : s.enabled,
          hiddenRegions:
            m.region && s.hiddenRegions[m.category]?.includes(m.region)
              ? {
                  ...s.hiddenRegions,
                  [m.category]: s.hiddenRegions[m.category]!.filter((r) => r !== m.region),
                }
              : s.hiddenRegions,
          region: s.region && s.region !== m.region ? null : s.region,
          hideCompleted:
            s.hideCompleted && id in useProgress.getState().completed ? false : s.hideCompleted,
        })
        return { enabledCategory, enabledMasterMode }
      },
      clearFocus: () => set({ focusId: null }),
      setQuery: (query) => set({ query }),
      setMenuOpen: (menuOpen) => set({ menuOpen }),
      setMenuWidth: (w) => set({ menuWidth: Math.max(MENU_MIN_WIDTH, Math.round(w)) }),
      toggleCatRegion: (cat, region) =>
        set((s) => {
          const cur = s.hiddenRegions[cat] ?? []
          const next = cur.includes(region) ? cur.filter((r) => r !== region) : [...cur, region]
          return { hiddenRegions: { ...s.hiddenRegions, [cat]: next } }
        }),
      setCatRegions: (cat, hidden) =>
        set((s) => ({ hiddenRegions: { ...s.hiddenRegions, [cat]: hidden } })),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: UI_STORAGE_KEY,
      storage: safeStorage,
      merge: (p, cur) => ({
        ...cur,
        ...(p as object),
        enabled: {
          ...cur.enabled,
          ...((p as { enabled?: Record<string, boolean> })?.enabled ?? {}),
        },
      }),
      partialize: (s) => ({
        enabled: s.enabled,
        hiddenRegions: s.hiddenRegions,
        menuWidth: s.menuWidth,
        masterMode: s.masterMode,
        hideCompleted: s.hideCompleted,
        theme: s.theme,
      }),
    },
  ),
)
