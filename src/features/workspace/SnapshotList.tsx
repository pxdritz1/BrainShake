import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDownIcon, Plus } from '@/components/icons/PaperIcons'
import type { useSnapshots } from './useSnapshots'

export function SnapshotList({ snapshots }: { snapshots: ReturnType<typeof useSnapshots> }) {
  const [label, setLabel] = useState('')
  const [expanded, setExpanded] = useState(false)
  const [showForm, setShowForm] = useState(false)

  return (
    <section className="sidebar-section snapshot-section" aria-label="Snapshots">
      <div className="snapshot-heading">
        <Button
          variant="ghost"
          className="section-label snapshot-disclosure"
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDownIcon size={13} className={expanded ? '' : 'collapsed'} />
          Snapshots
          {snapshots.items.length > 0 && (
            <span className="snapshot-count">{snapshots.items.length}</span>
          )}
        </Button>
        <Button
          variant="ghost"
          className="snapshot-add-button"
          title="Save a snapshot"
          aria-label="Save a snapshot"
          onClick={() => {
            setExpanded(true)
            setShowForm((current) => !current)
          }}
        >
          <Plus size={15} />
        </Button>
      </div>
      {expanded && (
        <>
          {showForm && (
            <form
              className="snapshot-form"
              onSubmit={(event) => {
                event.preventDefault()
                if (!label.trim()) return
                void snapshots.create(label).then((saved) => {
                  if (saved) {
                    setLabel('')
                    setShowForm(false)
                  }
                })
              }}
            >
              <Input
                autoFocus
                aria-label="Snapshot name"
                placeholder="Name this checkpoint"
                value={label}
                onChange={(event) => setLabel(event.target.value)}
              />
              <Button type="submit" disabled={snapshots.busy || !label.trim()}>
                Save
              </Button>
            </form>
          )}
          {snapshots.items.length ? (
            <div className="snapshot-list">
              {snapshots.items.map((item) => (
                <div className="snapshot-item" key={item.id}>
                  <div>
                    <strong>{item.label}</strong>
                    <time dateTime={item.createdAt}>
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit'
                      })}
                    </time>
                  </div>
                  <Button
                    variant="ghost"
                    disabled={snapshots.busy}
                    title={`Restore ${item.label}`}
                    onClick={() => void snapshots.restore(item.id)}
                  >
                    Restore
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="snapshot-empty">Save a checkpoint to revisit this workspace later.</p>
          )}
        </>
      )}
    </section>
  )
}
