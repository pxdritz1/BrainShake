import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CircleDot } from 'lucide-react'

export function EraserMenu({
  value,
  onChange,
  dockPosition
}: {
  value: number
  onChange: (value: number) => void
  dockPosition: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="tool-button"
          title="Eraser size"
          aria-label="Eraser size"
        >
          <CircleDot size={17} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={dockPosition === 'top' ? 'bottom' : dockPosition === 'bottom' ? 'top' : 'right'}
        sideOffset={10}
        className="toolbar-menu-panel eraser-menu"
      >
        <label htmlFor="eraser-size">
          Eraser size <output>{value}px</output>
        </label>
        <input
          id="eraser-size"
          className="eraser-size-range"
          type="range"
          min={6}
          max={96}
          step={2}
          value={value}
          onChange={(event) => onChange(Number(event.currentTarget.value))}
        />
      </PopoverContent>
    </Popover>
  )
}
