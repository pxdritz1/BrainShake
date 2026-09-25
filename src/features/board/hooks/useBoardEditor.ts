import { useState } from 'react'
import { makeId } from '@/lib/id'
import { defaultSize } from '@/features/canvas/objects/registry'
import { STORAGE_KEYS } from '../lib/storage'
import {
  addObjects,
  bringToFront,
  createObject,
  duplicateObjects,
  patchObject,
  removeObjects
} from '../lib/objects'
import { useBoards } from './useBoards'
import { useHistory } from './useHistory'
import type { Board, BoardPatch, CanvasItem, Point } from '../types'
import { isBoardItem, isConnectorItem } from '../types'
import type { useViewport } from '@/features/canvas/hooks/useViewport'

// Active board + history + selection + current tool, and the actions that edit them.
export function useBoardEditor({
  viewport,
  showToast
}: {
  viewport: ReturnType<typeof useViewport>
  showToast: (message: string) => void
}) {
  const boards = useBoards({
    onSaveError: () => showToast('Storage limit reached. Export your board to keep a backup.')
  })
  const history = useHistory({ getPresent: boards.getBoard, setPresent: boards.replaceBoard })
  const [selected, setSelected] = useState<string[]>([])
  const [tool, setTool] = useState<string>('select')
  const [strokeWidth, setStrokeWidth] = useState(4)
  const [eraserWidth, setEraserWidth] = useState(28)
  const { board } = boards
  const { commit } = history

  function switchBoard(id: string) {
    if (!boards.switchBoard(id)) return
    setSelected([])
    history.reset()
    viewport.reset()
  }

  function createBoard() {
    boards.createBoard()
    setSelected([])
    history.reset()
  }

  function deleteBoard(id: string) {
    if (boards.deleteBoard(id)) {
      setSelected([])
      history.reset()
    }
  }

  function replaceWorkspace(nextBoards: Board[], activeBoardId: string, id: string, name: string) {
    boards.replaceWorkspace(nextBoards, activeBoardId, id, name)
    history.reset()
    setSelected([])
    viewport.reset()
  }

  function undo() {
    if (history.undo()) setSelected([])
  }

  function redo() {
    if (history.redo()) setSelected([])
  }

  function addObject(type: string, data: Partial<CanvasItem> = {}, position?: Point) {
    const point = position || viewport.viewportCenter()
    const item = createObject(type, { ...defaultSize(type), ...data }, point)
    commit((current) => addObjects(current, [item]))
    setSelected([item.id])
    setTool('select')
  }

  function updateObject(id: string, patch: BoardPatch, saveHistory = true) {
    commit((current) => patchObject(current, id, patch), saveHistory)
  }

  function removeObject(id: string) {
    commit((current) => removeObjects(current, [id]))
    setSelected((current) => current.filter((value) => value !== id))
  }

  function connect(fromId: string, toId: string) {
    commit((current) =>
      addObjects(current, [{ id: makeId('connector'), type: 'connector', from: fromId, to: toId }])
    )
  }

  function unlinkSelection() {
    if (selected.length < 2) return
    const selectedIds = new Set(selected)
    commit((current) => ({
      ...current,
      objects: current.objects.filter(
        (item) =>
          !isConnectorItem(item) || !(selectedIds.has(item.from) && selectedIds.has(item.to))
      )
    }))
  }

  function selectAll() {
    setSelected(board.objects.map((item) => item.id))
  }

  function removeSelection() {
    if (!selected.length) return
    commit((current) => removeObjects(current, selected))
    setSelected([])
    showToast('Item removed')
  }

  function duplicateSelection() {
    const copies = duplicateObjects(
      board.objects.filter((item) => selected.includes(item.id)),
      24
    )
    if (!copies.length) return
    commit((current) => addObjects(current, copies))
    setSelected(copies.map((item) => item.id))
  }

  function copySelection() {
    const items = board.objects.filter((item) => selected.includes(item.id))
    if (!items.length) return
    navigator.clipboard?.writeText(JSON.stringify(items))
    sessionStorage.setItem(STORAGE_KEYS.clipboard, JSON.stringify(items))
    showToast('Copied to clipboard')
  }

  function cutSelection() {
    if (!selected.length) return
    copySelection()
    removeSelection()
  }

  function pasteSelection() {
    try {
      const saved: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEYS.clipboard) || '[]')
      if (!Array.isArray(saved) || !saved.every(isBoardItem)) throw Error()
      const items = duplicateObjects(saved, 32)
      if (!items.length) return
      commit((current) => addObjects(current, items))
      setSelected(items.map((item) => item.id))
    } catch {
      showToast('Could not paste')
    }
  }

  function bringSelectionToFront() {
    commit((current) => bringToFront(current, selected))
  }

  return {
    boards: boards.boards,
    board,
    workspace: boards.workspace,
    saveState: boards.saveState,
    renameBoard: boards.renameBoard,
    switchBoard,
    createBoard,
    deleteBoard,
    replaceWorkspace,
    commit,
    undo,
    redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    selected,
    setSelected,
    tool,
    setTool,
    strokeWidth,
    setStrokeWidth,
    eraserWidth,
    setEraserWidth,
    addObject,
    updateObject,
    removeObject,
    connect,
    unlinkSelection,
    selectAll,
    removeSelection,
    duplicateSelection,
    copySelection,
    cutSelection,
    pasteSelection,
    bringSelectionToFront,
    toggleBoardLink: boards.toggleBoardLink
  }
}
