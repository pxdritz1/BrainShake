import { Button } from '@/components/ui/button'
import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useImportExport } from '@/features/import-export/hooks/useImportExport'
import {
  BoxSelect,
  ChevronLeft,
  Link2,
  SlidersHorizontal,
  Upload
} from '@/components/icons/PaperIcons'
import { BoardList } from '@/features/board/components/BoardList'
import { ExportMenu } from '@/features/import-export/components/ExportMenu'
import { SidebarFooter } from './SidebarFooter'
import { SidebarSettings } from './SidebarSettings'
import { useEffect, useState, type CSSProperties } from 'react'
import type { usePreferences } from '@/features/preferences/usePreferences'
import { SnapshotList } from '@/features/workspace/SnapshotList'
import type { useSnapshots } from '@/features/workspace/useSnapshots'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/features/board/lib/storage'

const MIN_SIDEBAR_WIDTH = 220
const MAX_SIDEBAR_WIDTH = 560
const DEFAULT_SIDEBAR_WIDTH = 280

function maxSidebarWidth() {
  return Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, window.innerWidth - 320))
}

export function Sidebar({
  editor,
  transfer,
  snapshots,
  onImportFiles,
  autoHide,
  preferences,
  onOpenTour,
  expanded,
  onExpandedChange
}: {
  editor: ReturnType<typeof useBoardEditor>
  transfer: ReturnType<typeof useImportExport>
  snapshots: ReturnType<typeof useSnapshots>
  onImportFiles: () => void
  autoHide: boolean
  preferences: ReturnType<typeof usePreferences>
  onOpenTour: () => void
  expanded: boolean
  onExpandedChange: (expanded: boolean) => void
}) {
  const [page, setPage] = useState<'workspace' | 'customize'>('workspace')
  const [width, setWidth] = useLocalStorage(STORAGE_KEYS.sidebarWidth, DEFAULT_SIDEBAR_WIDTH)
  const savedWidth = Math.min(
    MAX_SIDEBAR_WIDTH,
    Math.max(MIN_SIDEBAR_WIDTH, Number(width) || DEFAULT_SIDEBAR_WIDTH)
  )
  const visibleWidth = Math.min(maxSidebarWidth(), savedWidth)
  const resizeTo = (next: number) =>
    setWidth(Math.min(maxSidebarWidth(), Math.max(MIN_SIDEBAR_WIDTH, next)))

  useEffect(() => {
    if (!expanded) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onExpandedChange(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [expanded, onExpandedChange])

  return (
    <>
      {expanded && (
        <div
          className="sidebar-backdrop"
          onClick={() => onExpandedChange(false)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`sidebar ${autoHide ? 'sidebar-auto-hide' : ''} ${expanded ? 'sidebar-expanded' : ''}`}
        style={{ '--sidebar-width': `${savedWidth}px` } as CSSProperties}
      >
        <div
          className="sidebar-resize-handle"
          role="separator"
          aria-label="Resize sidebar"
          aria-orientation="vertical"
          aria-valuemin={MIN_SIDEBAR_WIDTH}
          aria-valuemax={maxSidebarWidth()}
          aria-valuenow={visibleWidth}
          tabIndex={0}
          onPointerDown={(event) => {
            event.preventDefault()
            event.currentTarget.setPointerCapture(event.pointerId)
          }}
          onPointerMove={(event) => {
            if (!event.buttons) return
            const left = event.currentTarget.closest('.app')?.getBoundingClientRect().left
            if (left !== undefined) resizeTo(event.clientX - left)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
              event.preventDefault()
              resizeTo(visibleWidth + (event.key === 'ArrowRight' ? 16 : -16))
            } else if (event.key === 'Home' || event.key === 'End') {
              event.preventDefault()
              resizeTo(event.key === 'Home' ? MIN_SIDEBAR_WIDTH : maxSidebarWidth())
            }
          }}
        />
        <div className="sidebar-tabs">
          <Button
            variant="ghost"
            className="sidebar-tab"
            title={
              page === 'workspace' ? 'Customize appearance and accessibility' : 'Return to canvas'
            }
            onClick={() => {
              setPage((current) => (current === 'workspace' ? 'customize' : 'workspace'))
            }}
          >
            {page === 'workspace' ? <SlidersHorizontal size={15} /> : <ChevronLeft size={15} />}
            <span>{page === 'workspace' ? 'Customize' : 'Back to canvas'}</span>
          </Button>
        </div>
        {page === 'workspace' ? (
          <>
            <div className="sidebar-section">
              <div className="section-label">Canvas</div>
              <Button
                variant="ghost"
                className="nav-item active"
                onClick={() => onExpandedChange(false)}
              >
                <BoxSelect size={16} />
                <span>Canvas</span>
              </Button>
              <Button
                variant="ghost"
                className="nav-item"
                onClick={() => {
                  onExpandedChange(false)
                  onImportFiles()
                }}
              >
                <Upload size={16} />
                <span>Import</span>
              </Button>
              <Button
                variant="ghost"
                className="nav-item"
                onClick={() => {
                  onExpandedChange(false)
                  transfer.openUrlDialog()
                }}
              >
                <Link2 size={16} />
                <span>Import image URL</span>
              </Button>
              <ExportMenu
                onExport={transfer.exportAsBrainshake}
                onExportJson={transfer.exportAsJson}
              />
            </div>
            <BoardList
              boards={editor.boards}
              activeId={editor.board.id}
              onCreate={() => {
                editor.createBoard()
                onExpandedChange(false)
              }}
              onSwitch={(id) => {
                editor.switchBoard(id)
                onExpandedChange(false)
              }}
              onDelete={editor.deleteBoard}
              onToggleLink={editor.toggleBoardLink}
            />
            <SnapshotList snapshots={snapshots} />
            <SidebarFooter />
          </>
        ) : (
          <SidebarSettings preferences={preferences} onOpenTour={onOpenTour} />
        )}
      </aside>
    </>
  )
}
