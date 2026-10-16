import type { BoardPatch, CanvasItem } from '@/features/board/types'
import { STICKY_COLORS } from '@/features/board/lib/constants'
import { MarkdownEditor } from './MarkdownEditor'

export function StickyObject({
  item,
  onChange
}: {
  item: CanvasItem
  onChange: (id: string, patch: BoardPatch, saveHistory?: boolean) => void
}) {
  return (
    <div
      className={`widget-body sticky ${item.color || 'yellow'}`}
      style={{
        backgroundColor:
          item.fillColor || (STICKY_COLORS as Record<string, string>)[item.color || 'yellow']
      }}
    >
      <span className="sticky-tape" aria-hidden="true" />
      <h3>{item.title || 'Note'}</h3>
      <MarkdownEditor
        item={item}
        className="sticky-text"
        placeholder="Write a note in Markdown..."
        onChange={onChange}
      />
    </div>
  )
}
