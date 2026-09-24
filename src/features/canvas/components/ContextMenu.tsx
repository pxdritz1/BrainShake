import { ContextMenuContent, ContextMenuItem } from '@/components/ui/context-menu'
import { ArrowUpToLine, Camera, Copy, Link2, Trash2, Unlink } from 'lucide-react'

export function ContextMenu({
  onDuplicate,
  onDelete,
  onCopy,
  onFront,
  onLink,
  onUnlink,
  canUnlink,
  onScreenshot,
  canEdit
}: {
  onDuplicate: () => void
  onDelete: () => void
  onCopy: () => void
  onFront: () => void
  onLink: () => void
  onUnlink: () => void
  canUnlink: boolean
  onScreenshot: () => void | Promise<void>
  canEdit: boolean
}) {
  return (
    <ContextMenuContent className="context-menu">
      <ContextMenuItem disabled={!canEdit} onSelect={onDuplicate}>
        <Copy size={14} /> Duplicate
      </ContextMenuItem>
      <ContextMenuItem disabled={!canEdit} onSelect={onCopy}>
        <Copy size={14} /> Copy
      </ContextMenuItem>
      <ContextMenuItem disabled={!canEdit} onSelect={onFront}>
        <ArrowUpToLine size={14} /> Bring to front
      </ContextMenuItem>
      <ContextMenuItem disabled={!canEdit} onSelect={onLink}>
        <Link2 size={14} /> Link elements
      </ContextMenuItem>
      <ContextMenuItem disabled={!canUnlink} onSelect={onUnlink}>
        <Unlink size={14} /> Unlink elements
      </ContextMenuItem>
      <ContextMenuItem disabled={!canEdit} variant="destructive" onSelect={onDelete}>
        <Trash2 size={14} /> Delete
      </ContextMenuItem>
      <ContextMenuItem onSelect={onScreenshot}>
        <Camera size={14} /> Screenshot workspace
      </ContextMenuItem>
    </ContextMenuContent>
  )
}
