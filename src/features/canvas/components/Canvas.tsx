import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useViewport } from '@/features/canvas/hooks/useViewport'
import type { useCanvasPointer } from '@/features/canvas/hooks/useCanvasPointer'
import type { BoardPatch } from '@/features/board/types'
import { isCanvasItem } from '@/features/board/types'
import { getStrokeBounds, getStrokeGroups } from '@/features/board/lib/objects'
import { ContextMenu as ShadcnContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { useState, type CSSProperties } from 'react'
import { CanvasObject } from '../objects/CanvasObject'
import { ConnectorLayer } from './ConnectorLayer'
import { DraftStroke } from './DraftStroke'
import { DropOverlay } from './DropOverlay'
import { EmptyState } from './EmptyState'
import { ContextMenu } from './ContextMenu'

export function Canvas({
  editor,
  viewport,
  pointer,
  grid,
  onImportFiles,
  onScreenshot,
  presenting,
  presentingItemId
}: {
  editor: ReturnType<typeof useBoardEditor>
  viewport: ReturnType<typeof useViewport>
  pointer: ReturnType<typeof useCanvasPointer>
  grid: boolean
  onImportFiles: (files: FileList | File[]) => void
  onScreenshot: () => void | Promise<void>
  presenting: boolean
  presentingItemId: string | null
}) {
  const [dropActive, setDropActive] = useState(false)
  const { board, selected, strokeWidth } = editor
  const { canvasRef, onWheel, zoom, pan } = viewport
  const contentObjects = board.objects.filter(isCanvasItem)
  const strokeGroups = getStrokeGroups(contentObjects)
  return (
    <ShadcnContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div
          ref={canvasRef}
          className={`canvas-shell ${grid ? '' : 'grid-off'} ${pointer.isPanning ? 'is-panning' : ''} ${presenting ? 'is-presenting' : ''}`}
          style={
            {
              '--canvas-pan-x': `${pan.x}px`,
              '--canvas-pan-y': `${pan.y}px`,
              '--canvas-zoom': zoom
            } as CSSProperties
          }
          onWheel={presenting ? undefined : onWheel}
          onPointerDown={
            presenting
              ? undefined
              : (event) => {
                  if (event.target !== event.currentTarget) {
                    const target = event.target
                    const isInteractiveTarget =
                      target instanceof Element &&
                      target.closest('button, input, textarea, select, [contenteditable="true"]')
                    if (editor.tool === 'pen' && !isInteractiveTarget) pointer.beginDrawing(event)
                    return
                  }
                  pointer.onPointerDown(event)
                }
          }
          onPointerMove={pointer.onPointerMove}
          onPointerUp={pointer.onPointerUp}
          onPointerCancel={pointer.onPointerUp}
          onDragOver={(event) => {
            event.preventDefault()
            setDropActive(true)
          }}
          onDragLeave={() => setDropActive(false)}
          onDrop={(event) => {
            event.preventDefault()
            setDropActive(false)
            onImportFiles(event.dataTransfer.files)
          }}
        >
          <div
            className="canvas-world"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: pointer.isPanning
                ? 'none'
                : presenting
                  ? 'transform 460ms cubic-bezier(.2,.75,.25,1)'
                  : 'transform 140ms cubic-bezier(.2,.75,.25,1)'
            }}
          >
            <ConnectorLayer objects={board.objects} />
            {strokeGroups.map((group) => {
              if (group.length < 2 || !group.some((item) => selected.includes(item.id))) return null
              const groupBounds = group
                .map(getStrokeBounds)
                .filter((bounds): bounds is NonNullable<typeof bounds> => Boolean(bounds))
                .reduce(
                  (result, bounds) => ({
                    minX: Math.min(result.minX, bounds.minX),
                    minY: Math.min(result.minY, bounds.minY),
                    maxX: Math.max(result.maxX, bounds.maxX),
                    maxY: Math.max(result.maxY, bounds.maxY)
                  }),
                  { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
                )
              return (
                <div
                  className="stroke-group-outline"
                  key={group.map((item) => item.id).join('-')}
                  style={{
                    left: groupBounds.minX,
                    top: groupBounds.minY,
                    width: groupBounds.maxX - groupBounds.minX,
                    height: groupBounds.maxY - groupBounds.minY
                  }}
                />
              )
            })}
            {contentObjects.map((item) => (
              <CanvasObject
                key={item.id}
                item={item}
                selected={selected.includes(item.id)}
                activeTool={editor.tool}
                presentingActive={presenting && item.id === presentingItemId}
                onSelect={pointer.selectObject}
                onDrag={pointer.beginDrag}
                onResize={pointer.beginResize}
                onChange={(id: string, patch: BoardPatch) => editor.updateObject(id, patch, false)}
                onRemove={editor.removeObject}
              />
            ))}
            {pointer.drawing && <DraftStroke drawing={pointer.drawing} strokeWidth={strokeWidth} />}
          </div>
          {!board.objects.length && <EmptyState />}
          {dropActive && <DropOverlay />}
        </div>
      </ContextMenuTrigger>
      {selected.length > 0 && (
        <ContextMenu
          onDuplicate={editor.duplicateSelection}
          onDelete={editor.removeSelection}
          onCopy={editor.copySelection}
          onFront={editor.bringSelectionToFront}
          onLink={() => editor.setTool('connector')}
          onUnlink={editor.unlinkSelection}
          canUnlink={selected.length >= 2}
          onCut={editor.cutSelection}
          onScreenshot={onScreenshot}
          canEdit={selected.length > 0}
        />
      )}
    </ShadcnContextMenu>
  )
}
