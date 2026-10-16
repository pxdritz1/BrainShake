import { Button } from '@/components/ui/button'
import { Maximize, Minus, Plus } from '@/components/icons/PaperIcons'

export function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onFit
}: {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onFit: () => void
}) {
  return (
    <div className="zoom-controls">
      <Button variant="ghost" className="icon-button" title="Zoom out" onClick={onZoomOut}>
        <Minus size={15} />
      </Button>
      <span className="zoom-value">{Math.round(zoom * 100)}%</span>
      <Button variant="ghost" className="icon-button" title="Zoom in" onClick={onZoomIn}>
        <Plus size={15} />
      </Button>
      <Button variant="ghost" className="icon-button" title="Fit content" onClick={onFit}>
        <Maximize size={15} />
      </Button>
    </div>
  )
}
