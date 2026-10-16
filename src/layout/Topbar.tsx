import { Button } from '@/components/ui/button'
import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useImportExport } from '@/features/import-export/hooks/useImportExport'
import { Menu, Presentation, Settings2, Upload, X } from '@/components/icons/PaperIcons'
import { BalloonIcon } from '@/components/icons/BalloonIcon'
import { BoardTitle } from '@/features/board/components/BoardTitle'
import { ExportMenu } from '@/features/import-export/components/ExportMenu'

export function Topbar({
  editor,
  transfer,
  onImportBoard,
  onToggleSettings,
  onToggleSidebar,
  sidebarExpanded,
  onOpenTour,
  onOpenPresentation
}: {
  editor: ReturnType<typeof useBoardEditor>
  transfer: ReturnType<typeof useImportExport>
  onImportBoard: () => void
  onToggleSettings: () => void
  onToggleSidebar: () => void
  sidebarExpanded: boolean
  onOpenTour: () => void
  onOpenPresentation: () => void
}) {
  return (
    <header className="topbar">
      <div className="brand">
        <Button
          variant="ghost"
          className="mobile-sidebar-trigger"
          title={sidebarExpanded ? 'Close navigation' : 'Open navigation'}
          aria-label={sidebarExpanded ? 'Close navigation' : 'Open navigation'}
          aria-expanded={sidebarExpanded}
          onClick={onToggleSidebar}
        >
          {sidebarExpanded ? <X size={18} /> : <Menu size={18} />}
        </Button>
        <img
          className="brand-logo"
          src={`${import.meta.env.BASE_URL}brainshake-stamp.svg`}
          alt="BrainShake"
        />
        <span className="brand-name">BrainShake</span>
      </div>
      <BoardTitle name={editor.board.name} onRename={editor.renameBoard} />
      <div className="top-actions">
        <span className="save-state">
          <i className="save-dot" />{' '}
          {editor.saveState === 'saved' ? 'Saved locally' : 'Local save failed'}
        </span>
        <ExportMenu
          onExport={transfer.exportAsBrainshake}
          onExportJson={transfer.exportAsJson}
          compact
        />
        <Button
          variant="ghost"
          className="icon-button"
          title="Import workspace or board"
          onClick={onImportBoard}
        >
          <Upload size={17} />
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          title="Accessibility Tour"
          onClick={onOpenTour}
        >
          <BalloonIcon />
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          title="Presentation mode"
          onClick={onOpenPresentation}
        >
          <Presentation size={17} />
        </Button>
        <Button variant="ghost" className="icon-button" title="Settings" onClick={onToggleSettings}>
          <Settings2 size={17} />
        </Button>
      </div>
    </header>
  )
}
