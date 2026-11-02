import { z } from 'zod'
import { dataset, MARKER_BY_ID } from '../data/loadMarkers'
import { CATEGORY_BY_ID } from '../data/categories'
import type { ProgressData } from '../store/progress'

export const EXPORT_SCHEMA_VERSION = 1

const exportSchema = z.object({
  app: z.literal('hyrule-tracker'),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  dataVersion: z.string().optional(),
  completed: z.record(z.string(), z.number()),
  notes: z.record(z.string(), z.string()).default({}),
})

export type ProgressExport = z.infer<typeof exportSchema>

export function buildExport(p: Pick<ProgressData, 'completed' | 'notes'>): ProgressExport {
  return {
    app: 'hyrule-tracker',
    schemaVersion: EXPORT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    dataVersion: dataset.version,
    completed: p.completed,
    notes: p.notes,
  }
}

export type ParseResult =
  | { ok: true; data: ProgressExport }
  | { ok: false; error: string }

export function parseExport(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'That file is not valid JSON.' }
  }
  const r = exportSchema.safeParse(json)
  if (!r.success) return { ok: false, error: 'This does not look like a Hyrule Tracker export.' }
  if (r.data.schemaVersion > EXPORT_SCHEMA_VERSION)
    return { ok: false, error: 'This export is from a newer version of the app.' }
  return { ok: true, data: r.data }
}

export interface ImportDiff {
  incoming: number
  newlyCompleted: number
  alreadyCompleted: number
  unknown: number
}

export function diffImport(
  current: Pick<ProgressData, 'completed'>,
  incoming: ProgressExport,
): ImportDiff {
  const ids = Object.keys(incoming.completed)
  const unknown = ids.filter((id) => !MARKER_BY_ID.has(id)).length
  const already = ids.filter((id) => id in current.completed).length
  return {
    incoming: ids.length,
    newlyCompleted: ids.length - already,
    alreadyCompleted: already,
    unknown,
  }
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`

export function buildCsv(p: Pick<ProgressData, 'completed' | 'notes'>): string {
  const rows = [['id', 'category', 'name', 'region', 'completed', 'completed_at', 'note']]
  for (const m of MARKER_BY_ID.values()) {
    const at = p.completed[m.id]
    rows.push([
      m.id,
      CATEGORY_BY_ID[m.category]?.label ?? m.category,
      m.name,
      m.region ?? '',
      at ? 'yes' : 'no',
      at ? new Date(at).toISOString() : '',
      p.notes[m.id] ?? '',
    ])
  }
  return rows.map((r) => r.map(csvCell).join(',')).join('\n')
}

export function download(filename: string, text: string, mime: string) {
  const url = URL.createObjectURL(new Blob([text], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
