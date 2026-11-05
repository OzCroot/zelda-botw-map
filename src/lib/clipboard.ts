import { toast } from 'sonner'

/** Copies text and says so. The clipboard can be missing (insecure page) or refused, so report that instead of throwing. */
export async function copyText(text: string, done: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    toast(done)
    return true
  } catch {
    toast.error("Couldn't copy to the clipboard")
    return false
  }
}
