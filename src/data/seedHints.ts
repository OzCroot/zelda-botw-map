// Local-only finding hints for Korok seeds (src/data/generated/). Loaded on demand: ~140 KB nobody needs until a dialog opens.
import { useEffect, useState } from 'react'

export interface SeedHint {
  location?: string
  puzzle?: string
}
type Hints = Record<string, SeedHint>

const loaders = import.meta.glob('./generated/seed-hints.json', { import: 'default' }) as Record<
  string,
  () => Promise<Hints>
>

let cache: Promise<Hints> | undefined
export function loadSeedHints(): Promise<Hints> {
  const load = Object.values(loaders)[0]
  cache ??= import.meta.env.MODE === 'test' || !load ? Promise.resolve({}) : load().catch(() => ({}))
  return cache
}

/** Hint for one marker; undefined until the hint file has loaded. */
export function useSeedHint(id: string | undefined): SeedHint | undefined {
  const [hints, setHints] = useState<Hints>()
  useEffect(() => {
    if (id && !hints) void loadSeedHints().then(setHints)
  }, [id, hints])
  return id ? hints?.[id] : undefined
}
