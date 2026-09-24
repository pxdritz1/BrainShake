import { seedObjects } from './constants'
import type { Board } from '../types'
import { isBoard } from '../types'
import { makeId } from '@/lib/id'
import { normalizeBoardShapes } from './objects'

export const STORAGE_KEYS = {
  boards: 'brainshake-boards-v1',
  activeBoard: 'brainshake-active-board',
  workspaceId: 'brainshake-workspace-id',
  workspaceName: 'brainshake-workspace-name',
  snapshotHead: 'brainshake-snapshot-head',
  pendingImport: 'brainshake-pending-import',
  theme: 'brainshake-theme',
  accent: 'brainshake-accent',
  dock: 'brainshake-dock',
  clipboard: 'brainshake-copy',
  fontSize: 'brainshake-font-size',
  highContrast: 'brainshake-high-contrast',
  reduceMotion: 'brainshake-reduce-motion',
  keyboardNavigation: 'brainshake-keyboard-navigation',
  enhancedFocus: 'brainshake-enhanced-focus',
  focusColor: 'brainshake-focus-color',
  tutorialCompleted: 'brainshake-accessibility-tour-complete',
  sidebarAutoHide: 'brainshake-sidebar-auto-hide',
  sidebarWidth: 'brainshake-sidebar-width',
  headerColor: 'brainshake-header-color',
  sidebarColor: 'brainshake-sidebar-color',
  canvasColor: 'brainshake-canvas-color',
  panelColor: 'brainshake-panel-color',
  propertiesAutoHide: 'brainshake-properties-auto-hide',
  propertiesPanelWidth: 'brainshake-properties-panel-width',
  autoSnapShapes: 'brainshake-shape-correction'
}

export function loadBoards(): Board[] {
  recoverPendingImport()
  try {
    const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEYS.boards) || 'null')
    if (Array.isArray(saved) && saved.length && saved.every(isBoard))
      return saved.map(normalizeBoardShapes)
  } catch {
    // Corrupted data falls back to the seed board.
  }
  return [{ id: 'board-main', name: 'My first idea', objects: seedObjects }]
}

function recoverPendingImport() {
  const raw = localStorage.getItem(STORAGE_KEYS.pendingImport)
  if (!raw) return
  try {
    const pending = JSON.parse(raw) as {
      state: 'staged' | 'committed'
      previous: Record<string, string | null>
      next: Record<string, string | null>
    }
    const values = pending.state === 'committed' ? pending.next : pending.previous
    for (const [key, value] of Object.entries(values)) {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    }
    localStorage.removeItem(STORAGE_KEYS.pendingImport)
  } catch {
    localStorage.removeItem(STORAGE_KEYS.pendingImport)
  }
}

export function saveBoards(boards: Board[]) {
  localStorage.setItem(STORAGE_KEYS.boards, JSON.stringify(boards))
}

export function loadWorkspaceIdentity() {
  return {
    id: localStorage.getItem(STORAGE_KEYS.workspaceId) || makeId('workspace'),
    name: localStorage.getItem(STORAGE_KEYS.workspaceName) || 'My workspace'
  }
}
