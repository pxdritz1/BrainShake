import { Input } from '@/components/ui/input'
import { Shapes } from '@/components/icons/PaperIcons'

export function BoardTitle({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  return (
    <div className="board-title">
      <Shapes size={15} />
      <Input
        aria-label="Board name"
        value={name}
        onChange={(event) => onRename(event.target.value)}
      />
    </div>
  )
}
