import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PencilLine } from '@/components/icons/PaperIcons'
import { STROKE_WIDTHS } from '@/features/board/lib/constants'

export function StrokeMenu({
  value,
  onChange,
  dockPosition,
  open,
  onOpenChange
}: {
  value: number
  onChange: (value: number) => void
  dockPosition: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="tool-button" title="Stroke width">
          <PencilLine size={17} />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side={dockPosition === 'top' ? 'bottom' : dockPosition === 'bottom' ? 'top' : 'right'}
        sideOffset={10}
        className="toolbar-menu-panel"
      >
        <label>
          Stroke width
          <Select
            value={String(value)}
            onValueChange={(next) => {
              onChange(Number(next))
              onOpenChange(false)
            }}
          >
            <SelectTrigger className="menu-select" aria-label="Stroke width">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STROKE_WIDTHS.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </PopoverContent>
    </Popover>
  )
}
