import { toast } from 'sonner'
import { createJSONStorage } from 'zustand/middleware'

/**
 * localStorage that reports failures instead of throwing. A full or blocked store (quota exceeded, private mode,
 * storage disabled) would otherwise lose changes silently, or throw out of a state update.
 */
const guarded: Storage = {
  get length() {
    return 0
  },
  clear: () => {},
  key: () => null,
  getItem: (name) => {
    try {
      return localStorage.getItem(name)
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch (e) {
      console.error('Could not save to localStorage', e)
      // A fixed id so repeated failures (every toggle) show one toast, not a pile of them.
      toast.error("Couldn't save your changes", {
        id: 'storage-error',
        description:
          'Browser storage is full or blocked. Export a backup from the Data tab so nothing is lost.',
        duration: 8000,
      })
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name)
    } catch {
      /* nothing to remove */
    }
  },
}

export const safeStorage = createJSONStorage(() => guarded)
