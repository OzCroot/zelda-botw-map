/**
 * Compact progress code: a bitset over the *sorted* list of marker ids,
 * base64url-encoded. Only valid for the same dataset version.
 */
function sortedIds(ids: Iterable<string>): string[] {
  return [...ids].sort()
}

export function encodeProgress(allIds: Iterable<string>, completed: Set<string>): string {
  const ids = sortedIds(allIds)
  const bytes = new Uint8Array(Math.ceil(ids.length / 8))
  ids.forEach((id, i) => {
    if (completed.has(id)) bytes[i >> 3]! |= 1 << (i & 7)
  })
  let bin = ''
  bytes.forEach((b) => (bin += String.fromCharCode(b)))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function decodeProgress(allIds: Iterable<string>, code: string): string[] | null {
  try {
    const b64 = code.trim().replace(/-/g, '+').replace(/_/g, '/')
    const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4))
    const ids = sortedIds(allIds)
    if (bin.length !== Math.ceil(ids.length / 8)) return null
    return ids.filter((_, i) => (bin.charCodeAt(i >> 3) >> (i & 7)) & 1)
  } catch {
    return null
  }
}
