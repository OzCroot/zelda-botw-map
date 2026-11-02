import { describe, expect, it } from 'vitest'
import { buildCsv, buildExport, diffImport, parseExport } from './exportImport'

describe('exportImport', () => {
  const progress = { completed: { 'shrine:1': 1700000000000 }, notes: { 'shrine:1': 'say "hi", ok' } }

  it('round-trips an export', () => {
    const r = parseExport(JSON.stringify(buildExport(progress)))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.data.completed).toEqual(progress.completed)
      expect(r.data.notes).toEqual(progress.notes)
    }
  })
  it('rejects bad input', () => {
    expect(parseExport('nope').ok).toBe(false)
    expect(parseExport('{"a":1}').ok).toBe(false)
    expect(parseExport(JSON.stringify({ ...buildExport(progress), schemaVersion: 99 })).ok).toBe(false)
  })
  it('diffs against current progress', () => {
    const inc = buildExport({ completed: { 'shrine:1': 1, 'shrine:2': 2, bogus: 3 }, notes: {} })
    expect(diffImport({ completed: { 'shrine:1': 1 } }, inc)).toEqual({
      incoming: 3, newlyCompleted: 2, alreadyCompleted: 1, unknown: 1,
    })
  })
  it('escapes CSV cells', () => {
    expect(buildCsv(progress)).toContain('"say ""hi"", ok"')
  })
})
