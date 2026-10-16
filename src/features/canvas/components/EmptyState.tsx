import { MindMap } from '@/components/icons/PaperIcons'

export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-illustration" aria-hidden="true">
        <MindMap size={58} />
      </div>
      <h1>Set a thought in motion</h1>
      <p>
        Drop a reference, add a note, sketch a line between ideas. This board saves automatically on
        this device.
      </p>
    </div>
  )
}
