import { useEffect, useRef, useState } from 'react'
import { makeId } from '@/lib/id'
import { loadBoards, loadWorkspaceIdentity, saveBoards, STORAGE_KEYS } from '../lib/storage'
import { normalizeBoardShapes } from '../lib/objects'
import type { Board } from '../types'

export function useBoards({ onSaveError }: { onSaveError: () => void }) {
  const [boards, setBoards] = useState(loadBoards)
  const [board, setBoard] = useState(
    () =>
      boards.find((item) => item.id === localStorage.getItem(STORAGE_KEYS.activeBoard)) || boards[0]
  )
  const [workspace, setWorkspace] = useState(loadWorkspaceIdentity)
  const [saveState, setSaveState] = useState<'saved' | 'error'>('saved')
  // Latest board, readable synchronously between renders (async imports, pointer moves).
  const boardRef = useRef(board)

  useEffect(() => {
    let cancelled = false
    let state: 'saved' | 'error' = 'saved'
    try {
      saveBoards(boards)
      localStorage.setItem(STORAGE_KEYS.activeBoard, board.id)
      localStorage.setItem(STORAGE_KEYS.workspaceId, workspace.id)
      localStorage.setItem(STORAGE_KEYS.workspaceName, workspace.name)
    } catch {
      state = 'error'
      onSaveError()
    }
    queueMicrotask(() => {
      if (!cancelled) setSaveState(state)
    })
    return () => {
      cancelled = true
    }
  }, [boards, board.id, workspace]) // eslint-disable-line react-hooks/exhaustive-deps

  function getBoard() {
    return boardRef.current
  }

  // Replaces the active board and writes it back into the list, matched by id.
  function replaceBoard(next: Board) {
    boardRef.current = next
    setBoard(next)
    setBoards((current) => current.map((item) => (item.id === next.id ? next : item)))
  }

  function renameBoard(name: string) {
    replaceBoard({ ...boardRef.current, name })
  }

  function createBoard() {
    const next = { id: makeId('board'), name: `Board ${boards.length + 1}`, objects: [] }
    setBoards((current) => [...current, next])
    replaceBoard(next)
  }

  // Returns false when nothing changed.
  function switchBoard(id: string) {
    const next = boards.find((item) => item.id === id)
    if (!next || next.id === board.id) return false
    replaceBoard(next)
    return true
  }

  // Returns false when the board cannot be deleted (last board).
  function deleteBoard(id: string) {
    if (boards.length < 2) return false
    const nextBoards = boards.filter((item) => item.id !== id)
    setBoards(nextBoards)
    if (board.id === id) replaceBoard(nextBoards[0])
    return true
  }

  function toggleBoardLink(targetId: string) {
    const current = boardRef.current
    if (targetId === current.id) return
    const target = boards.find((item) => item.id === targetId)
    if (!target) return
    const linked = current.linkedBoardIds?.includes(targetId) ?? false
    const nextCurrent = {
      ...current,
      linkedBoardIds: linked
        ? (current.linkedBoardIds || []).filter((id) => id !== targetId)
        : [...(current.linkedBoardIds || []), targetId]
    }
    const nextTarget = {
      ...target,
      linkedBoardIds: linked
        ? (target.linkedBoardIds || []).filter((id) => id !== current.id)
        : [...(target.linkedBoardIds || []), current.id]
    }
    boardRef.current = nextCurrent
    setBoard(nextCurrent)
    setBoards((items) =>
      items.map((item) =>
        item.id === current.id ? nextCurrent : item.id === target.id ? nextTarget : item
      )
    )
  }

  function replaceWorkspace(nextBoards: Board[], activeBoardId: string, id: string, name: string) {
    const normalizedBoards = nextBoards.map(normalizeBoardShapes)
    const active = normalizedBoards.find((item) => item.id === activeBoardId)
    if (!active || !normalizedBoards.length) throw Error('Invalid workspace')
    boardRef.current = active
    setBoards(normalizedBoards)
    setBoard(active)
    setWorkspace({ id, name })
  }

  return {
    boards,
    board,
    workspace,
    saveState,
    getBoard,
    replaceBoard,
    renameBoard,
    createBoard,
    switchBoard,
    deleteBoard,
    toggleBoardLink,
    replaceWorkspace
  }
}
