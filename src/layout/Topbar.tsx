import { Button } from '@/components/ui/button'
import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useImportExport } from '@/features/import-export/hooks/useImportExport'
<<<<<<< HEAD
import { MoreHorizontal, PanelRight, Presentation, Upload } from 'lucide-react'
=======
import { Menu, Presentation, Settings2, Upload, X } from '@/components/icons/PaperIcons'
>>>>>>> c29df95 (feat(layout): adapta navegação responsiva e atualiza a marca)
import { BalloonIcon } from '@/components/icons/BalloonIcon'
import { BoardTitle } from '@/features/board/components/BoardTitle'
import { ExportMenu } from '@/features/import-export/components/ExportMenu'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'

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
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="icon-button"
              title="More workspace actions"
              aria-label="More workspace actions"
            >
              <MoreHorizontal size={18} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={8}
            className="workspace-actions-menu topbar-actions-menu"
          >
            <DropdownMenuItem onSelect={onImportBoard}>
              <Upload size={15} /> Import board or workspace
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onOpenPresentation}>
              <Presentation size={15} /> Presentation mode
            </DropdownMenuItem>
            {editor.selected.length > 0 && (
              <DropdownMenuItem onSelect={onToggleSettings}>
                <PanelRight size={15} /> Toggle properties panel
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={onOpenTour}>
              <BalloonIcon /> Accessibility tour
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
