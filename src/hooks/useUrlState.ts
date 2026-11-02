import { useEffect } from 'react'
import { MARKER_BY_ID } from '../data/loadMarkers'
import { useUi } from '../store/ui'

/** Deep links: ?m=<markerId> selects a marker; selection is mirrored back to the URL. */
export function useUrlState() {
  const selectedId = useUi((s) => s.selectedId)
  const select = useUi((s) => s.select)

  useEffect(() => {
    const id = new URLSearchParams(location.search).get('m')
    if (id && MARKER_BY_ID.has(id)) select(id)
  }, [select])

  useEffect(() => {
    const url = new URL(location.href)
    if (selectedId) url.searchParams.set('m', selectedId)
    else url.searchParams.delete('m')
    history.replaceState(null, '', url)
  }, [selectedId])
}
