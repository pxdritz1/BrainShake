import { Button } from '@/components/ui/button'
import type React from 'react'
import type { CanvasItem } from '@/features/board/types'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'

// Card with a draggable titlebar and a close button, used by framed object types.
export function WidgetFrame({
  item,
  onDrag,
  onRemove,
  showTitlebar = true,
  children
}: {
  item: CanvasItem
  onDrag: (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) => void
  onRemove: (id: string) => void
  showTitlebar?: boolean
  children: ReactNode
}) {
  return (
    <div className="object-card">
      {showTitlebar && (
        <div className="widget-titlebar" onPointerDown={(event) => onDrag(event, item)}>
          <span>
            {item.name || item.title || item.type}
            {item.slide && (
              <b className="slide-marker-inline" title="Included in presentation">
                {item.slideOrder}
              </b>
            )}
          </span>
          <Button
            variant="ghost"
            type="button"
            aria-label="Close widget"
            title="Close widget"
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => {
              event.stopPropagation()
              onRemove(item.id)
            }}
          >
            <X size={13} />
          </Button>
        </div>
      )}
      {children}
    </div>
  )
}
