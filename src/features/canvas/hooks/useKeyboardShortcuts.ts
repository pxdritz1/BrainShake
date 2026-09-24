import { useEffect } from 'react'
import { TOOL_SHORTCUTS } from '@/features/board/lib/constants'

function isTyping(target: EventTarget | null = document.activeElement) {
  if (!(target instanceof HTMLElement)) return false
  return (
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) ||
    target.isContentEditable ||
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  )
}

// Global shortcuts. Re-subscribes on every render so handlers always see fresh state.
export function useKeyboardShortcuts({
  undo,
  redo,
  selectAll,
  copy,
  paste,
  remove,
  cancel,
  setTool,
  enabled
}: {
  undo: () => void
  redo: () => void
  selectAll: () => void
  copy: () => void
  paste: (event: ClipboardEvent) => void
  remove: () => void
  cancel: () => void
  setTool: (tool: string) => void
  enabled: boolean
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!enabled) return
      const typing = isTyping()
      const mod = event.metaKey || event.ctrlKey
      const key = event.key.toLowerCase()
      if (mod && key === 'z') {
        event.preventDefault()
        if (event.shiftKey) redo()
        else undo()
        return
      }
      if (mod && key === 'y') {
        event.preventDefault()
        redo()
        return
      }
      const modActions: Record<string, (() => void) | undefined> = {
        a: selectAll,
        c: copy
      }
      if (mod && modActions[key] && !typing) {
        event.preventDefault()
        modActions[key]()
        return
      }
      if (typing) return
      if (event.key === 'Delete' || event.key === 'Backspace') remove()
      if (event.key === 'Escape') cancel()
      const shortcut = (TOOL_SHORTCUTS as Record<string, string | undefined>)[key]
      if (shortcut) setTool(shortcut)
    }
    const onPaste = (event: ClipboardEvent) => {
      if (isTyping(event.target)) return
      paste(event)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('paste', onPaste)
    }
  }, [cancel, copy, enabled, paste, redo, remove, selectAll, setTool, undo])
}
