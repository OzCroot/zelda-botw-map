import { afterEach, describe, expect, it, vi } from 'vitest'

const error = vi.fn()
vi.mock('sonner', () => ({ toast: { error: (...a: unknown[]) => error(...a) } }))

import { safeStorage } from './safeStorage'

afterEach(() => {
  vi.restoreAllMocks()
  error.mockClear()
})

describe('safeStorage', () => {
  it('stores and reads normally', () => {
    safeStorage!.setItem('k', { state: { a: 1 }, version: 0 })
    expect(safeStorage!.getItem('k')).toEqual({ state: { a: 1 }, version: 0 })
    expect(error).not.toHaveBeenCalled()
  })

  it('shows one toast instead of throwing when storage is full', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(() => safeStorage!.setItem('k', { state: {}, version: 0 })).not.toThrow()
    expect(error).toHaveBeenCalledWith(
      "Couldn't save your changes",
      expect.objectContaining({ id: 'storage-error' }),
    )
  })

  it('treats unreadable storage as empty', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(safeStorage!.getItem('k')).toBeNull()
  })
})
