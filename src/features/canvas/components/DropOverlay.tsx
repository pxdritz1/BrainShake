import { Upload } from '@/components/icons/PaperIcons'

export function DropOverlay() {
  return (
    <div className="drop-overlay">
      <Upload size={20} /> Drop to add to the board
    </div>
  )
}
