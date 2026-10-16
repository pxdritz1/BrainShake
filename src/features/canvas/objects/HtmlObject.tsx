import type { CanvasItem } from '@/features/board/types'
import { FileCode2 } from '@/components/icons/PaperIcons'

export function HtmlObject({ item }: { item: CanvasItem }) {
  return (
    <div className="widget-body html-card">
      <div className="html-label">
        <FileCode2 size={12} /> {item.name}
      </div>
      <iframe title={item.name} src={item.src} sandbox="allow-scripts" />
    </div>
  )
}
