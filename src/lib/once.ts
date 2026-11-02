/** Compute on first call, then reuse. Keeps module-level work off the startup path. */
export function once<T>(fn: () => T): () => T {
  let done = false
  let value: T
  return () => {
    if (!done) {
      value = fn()
      done = true
    }
    return value
  }
}
