import { Button } from '@/components/ui/button'
import type { BoardPatch, BoardItem } from '@/features/board/types'
import { PanelRight, X } from '@/components/icons/PaperIcons'
import { ObjectProperties } from './ObjectProperties'
import type { CSSProperties } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/features/board/lib/storage'

const MIN_PANEL_WIDTH = 220
const DEFAULT_PANEL_WIDTH = 260

function getMaxPanelWidth() {
  return Math.max(MIN_PANEL_WIDTH, Math.min(640, window.innerWidth - 42))
}

export function PropertiesPanel({
  item,
  onChange,
  onClose
}: {
  item?: BoardItem
  onChange: (id: string, patch: BoardPatch, saveHistory?: boolean) => void
  onClose: () => void
}) {
  const [width, setWidth] = useLocalStorage(STORAGE_KEYS.propertiesPanelWidth, DEFAULT_PANEL_WIDTH)
  const maxWidth = getMaxPanelWidth()
  const clampedWidth = Math.min(maxWidth, Math.max(MIN_PANEL_WIDTH, width))

  const resizeBy = (amount: number) =>
    setWidth((current) => Math.min(getMaxPanelWidth(), Math.max(MIN_PANEL_WIDTH, current + amount)))

  return (
    <div
      className="floating-panel"
      style={{ '--properties-panel-width': `${clampedWidth}px` } as CSSProperties}
    >
      <div
        className="panel-resize-handle"
        role="separator"
        aria-label="Resize properties panel"
        aria-orientation="vertical"
        aria-valuemin={MIN_PANEL_WIDTH}
        aria-valuemax={maxWidth}
        aria-valuenow={clampedWidth}
        tabIndex={0}
        onPointerDown={(event) => {
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={(event) => {
          if (event.buttons === 0) return
          const right = event.currentTarget.parentElement?.getBoundingClientRect().right
          if (right === undefined) return
          setWidth(Math.min(getMaxPanelWidth(), Math.max(MIN_PANEL_WIDTH, right - event.clientX)))
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') {
            event.preventDefault()
            resizeBy(16)
          } else if (event.key === 'ArrowRight') {
            event.preventDefault()
            resizeBy(-16)
          } else if (event.key === 'Home') {
            event.preventDefault()
            setWidth(MIN_PANEL_WIDTH)
          } else if (event.key === 'End') {
            event.preventDefault()
            setWidth(getMaxPanelWidth())
          }
        }}
      />
      <div className="panel-heading">
        <span>
          <PanelRight size={14} /> Properties
        </span>
        <Button variant="ghost" className="icon-button" title="Close properties" onClick={onClose}>
          <X size={14} />
        </Button>
      </div>
      <ObjectProperties item={item} onChange={onChange} />
    </div>
  )
}
