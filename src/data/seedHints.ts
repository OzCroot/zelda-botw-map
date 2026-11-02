// Local-only finding hints for Korok seeds (src/data/generated/ is gitignored).
export interface SeedHint {
  location?: string
  puzzle?: string
}

const generated = import.meta.glob('./generated/seed-hints.json', { eager: true, import: 'default' }) as Record<
  string,
  Record<string, SeedHint>
>

export const SEED_HINTS: Record<string, SeedHint> =
  import.meta.env.MODE === 'test' ? {} : (Object.values(generated)[0] ?? {})
