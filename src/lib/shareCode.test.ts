import { describe, expect, it } from 'vitest'
import { decodeProgress, encodeProgress } from './shareCode'

const ids = Array.from({ length: 53 }, (_, i) => `m-${i}`)

describe('shareCode', () => {
  it('round-trips', () => {
    const done = new Set(['m-0', 'm-7', 'm-8', 'm-52'])
    const code = encodeProgress(ids, done)
    expect(new Set(decodeProgress(ids, code))).toEqual(done)
  })
  it('rejects wrong-size / garbage codes', () => {
    expect(decodeProgress(ids, 'AAAA')).toBeNull()
    expect(decodeProgress(ids, '***')).toBeNull()
  })
})
