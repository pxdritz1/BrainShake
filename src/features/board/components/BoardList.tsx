import { Button } from '@/components/ui/button'
import type { Board } from '@/features/board/types'
import { Link2, Plus, X } from '@/components/icons/PaperIcons'

export function BoardList({
  boards,
  activeId,
  onCreate,
  onSwitch,
  onDelete,
  onToggleLink
}: {
  boards: Board[]
  activeId: string
  onCreate: () => void
  onSwitch: (id: string) => void
  onDelete: (id: string) => void
  onToggleLink: (id: string) => void
}) {
  return (
    <div className="sidebar-section">
      <div className="section-label">
        Boards{' '}
        <Button
          variant="ghost"
          className="icon-button"
          style={{ display: 'inline-grid', width: 20, height: 20 }}
          title="New board"
          onClick={onCreate}
        >
          <Plus size={14} />
        </Button>
      </div>
      <div className="board-list">
        {boards.map((item) => (
          <div key={item.id} className={'board-item ' + (item.id === activeId ? 'active' : '')}>
            <Button variant="ghost" className="board-switch" onClick={() => onSwitch(item.id)}>
              {item.name}
            </Button>
            {boards.length > 1 && (
              <Button
                variant="ghost"
                className={`board-link ${item.linkedBoardIds?.length ? 'active' : ''}`}
                aria-label="Link board"
                title="Link board to active board"
                onClick={() => onToggleLink(item.id)}
              >
                <Link2 size={13} />
              </Button>
            )}
            {boards.length > 1 && (
              <Button
                variant="ghost"
                className="board-delete"
                aria-label="Delete board"
                onClick={() => onDelete(item.id)}
              >
                <X size={13} />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
