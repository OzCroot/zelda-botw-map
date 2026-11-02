import { useEffect } from 'react'
import { MARKER_BY_ID } from '../data/loadMarkers'
import { useUi, type Tab } from '../store/ui'

const TABS = ['filters', 'list', 'stats', 'data']

/**
 * Deep links: ?m=<markerId> selects a marker (mirrored back to the URL while selected);
 * ?focus=<markerId> reveals a marker on the map without opening its dialog;
 * ?tab=filters|list|stats|data opens a panel tab; ?q=<text> pre-fills the search box.
 */
export function useUrlState() {
  const selectedId = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const id = params.get('m')
    if (id && MARKER_BY_ID.has(id)) {
      useUi.getState().reveal(id)
      select(id)
    }
    const focus = params.get('focus')
    if (focus && MARKER_BY_ID.has(focus)) useUi.getState().reveal(focus)
    const tab = params.get('tab')
    if (tab && TABS.includes(tab)) {
      useUi.getState().setTab(tab as Tab)
      useUi.getState().setMenuOpen(true)
    }
    const q = params.get('q')
    if (q) useUi.getState().setQuery(q)
  }, [select])

  useEffect(() => {
    const url = new URL(location.href)
    if (selectedId) url.searchParams.set('m', selectedId)
    else url.searchParams.delete('m')
    history.replaceState(null, '', url)
  }, [selectedId])
}
