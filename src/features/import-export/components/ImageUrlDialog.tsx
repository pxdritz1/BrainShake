import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { Link2, X } from '@/components/icons/PaperIcons'

export function ImageUrlDialog({
  onClose,
  onSubmit
}: {
  onClose: () => void
  onSubmit: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="url-dialog" showCloseButton={false} aria-describedby={undefined}>
        <div className="panel-heading">
          <DialogTitle>
            <Link2 size={14} /> Add image URL
          </DialogTitle>
          <Button variant="ghost" className="icon-button" title="Close" onClick={onClose}>
            <X size={14} />
          </Button>
        </div>
        <Input
          className="url-input"
          autoFocus
          value={url}
          placeholder="https://example.com/image.jpg"
          onChange={(event) => setUrl(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSubmit(url)
          }}
        />
        <div className="dialog-actions">
          <Button variant="ghost" className="dialog-button secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button className="dialog-button primary" onClick={() => onSubmit(url)}>
            Add image
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
