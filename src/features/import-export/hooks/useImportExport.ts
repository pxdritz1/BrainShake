import { useState } from 'react'
import { exportBrainshake, exportJson, importBrainshake } from '../lib/archive'
import { fileToObject } from '../lib/files'
import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useSnapshots } from '@/features/workspace/useSnapshots'
import { commitWorkspaceImport } from '@/features/workspace/import'
import { WorkspaceBusyError } from '@/features/workspace/operationGate'
import { STORAGE_KEYS } from '@/features/board/lib/storage'
import { normalizeShape } from '@/features/board/lib/objects'
import { isBoardItem } from '@/features/board/types'
import { clipboardTextSize } from '../lib/files'

export function useImportExport({
  editor,
  snapshots,
  showToast
}: {
  editor: ReturnType<typeof useBoardEditor>
  snapshots: ReturnType<typeof useSnapshots>
  showToast: (message: string) => void
}) {
  const [urlOpen, setUrlOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  async function importFiles(files: FileList | File[] | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      try {
        const object = await fileToObject(file)
        if (object) editor.addObject(object.type, object.data)
        else showToast(`Unsupported format: ${file.name}`)
      } catch {
        showToast(`Could not import ${file.name}`)
      }
    }
  }

  function pasteClipboard(event: ClipboardEvent) {
    const clipboard = event.clipboardData
    if (!clipboard) return

    const pasteInternalSelection = () => {
      try {
        const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.clipboard) || '[]')
        if (!Array.isArray(saved) || !saved.length || !saved.every(isBoardItem)) return
        event.preventDefault()
        editor.pasteSelection()
      } catch {
        // A missing or invalid app clipboard should leave the native paste alone.
      }
    }

    const image = Array.from(clipboard.items)
      .find((item) => item.kind === 'file' && item.type.startsWith('image/'))
      ?.getAsFile()
    if (image) {
      event.preventDefault()
      void importFiles([image])
      return
    }

    const text = clipboard.getData('text/plain')
    if (!text) {
      pasteInternalSelection()
      return
    }

    try {
      const copiedItems: unknown = JSON.parse(text)
      if (Array.isArray(copiedItems) && copiedItems.length && copiedItems.every(isBoardItem)) {
        event.preventDefault()
        sessionStorage.setItem(STORAGE_KEYS.clipboard, JSON.stringify(copiedItems))
        editor.pasteSelection()
        return
      }
    } catch {
      // Plain clipboard text is created as editable Markdown below.
    }

    event.preventDefault()
    editor.addObject('text', {
      text,
      editing: true,
      ...clipboardTextSize(text)
    })
  }

  function submitImageUrl(url: string) {
    if (!/^https?:\/\//i.test(url)) {
      showToast('Enter a valid image URL')
      return
    }
    editor.addObject('image', { src: url, name: 'Web image' })
    setUrlOpen(false)
  }

  async function exportAsBrainshake() {
    try {
      const { snapshots: savedSnapshots, assets } = await snapshots.loadForExport()
      await exportBrainshake(
        {
          format: 'brainshake',
          schemaVersion: 2,
          id: editor.workspace.id,
          name: editor.workspace.name,
          activeBoardId: editor.board.id,
          headSnapshotId: snapshots.headId,
          boards: editor.boards,
          snapshots: savedSnapshots
        },
        assets
      )
      showToast('Workspace exported')
    } catch {
      showToast('Could not export workspace')
    }
  }

  function exportAsJson() {
    exportJson(editor.board)
    showToast('Board exported')
  }

  async function importBoardFile(file: File) {
    try {
      const imported = await importBrainshake(file)
      if (imported.kind === 'board') {
        const objects = imported.data.objects.map(normalizeShape)
        await snapshots.runExclusive(async () => {
          editor.commit((current) => ({ ...current, ...imported.data, objects, id: current.id }))
          editor.setSelected([])
        })
        showToast('Board imported')
        return
      }
      if (!window.confirm('Replace the current workspace and its snapshots with this file?')) return
      await snapshots.runExclusive(async () => {
        setImporting(true)
        try {
          await commitWorkspaceImport(
            imported.data,
            () =>
              snapshots.replaceAll(
                imported.data.snapshots,
                imported.data.headSnapshotId,
                imported.assets
              ),
            () =>
              editor.replaceWorkspace(
                imported.data.boards,
                imported.data.activeBoardId,
                imported.data.id,
                imported.data.name
              )
          )
        } finally {
          setImporting(false)
        }
      })
      showToast('Workspace imported')
    } catch (error) {
      showToast(
        error instanceof WorkspaceBusyError
          ? 'Wait for the current workspace operation'
          : error instanceof Error && error.name === 'QuotaExceededError'
            ? 'Browser storage is full; workspace import was not applied'
            : 'Could not import BrainShake file or save workspace'
      )
    }
  }

  return {
    urlOpen,
    importing,
    openUrlDialog: () => setUrlOpen(true),
    closeUrlDialog: () => setUrlOpen(false),
    submitImageUrl,
    importFiles,
    pasteClipboard,
    importBoardFile,
    exportAsBrainshake,
    exportAsJson
  }
}
