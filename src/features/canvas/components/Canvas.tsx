import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useViewport } from '@/features/canvas/hooks/useViewport'
import type { useCanvasPointer } from '@/features/canvas/hooks/useCanvasPointer'
import { isCanvasItem } from '@/features/board/types'
import type { BoardPatch, CanvasItem } from '@/features/board/types'
import { getStrokeBounds, getStrokeGroups } from '@/features/board/lib/objects'
import { ContextMenu as ShadcnContextMenu, ContextMenuTrigger } from '@/components/ui/context-menu'
import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type React from 'react'
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
  const handlers = useRef({
    selectObject: pointer.selectObject,
    beginDrag: pointer.beginDrag,
    beginResize: pointer.beginResize,
    updateObject: editor.updateObject,
    removeObject: editor.removeObject
  })
  useLayoutEffect(() => {
    handlers.current = {
      selectObject: pointer.selectObject,
      beginDrag: pointer.beginDrag,
      beginResize: pointer.beginResize,
      updateObject: editor.updateObject,
      removeObject: editor.removeObject
    }
  })
  const selectObject = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) =>
      handlers.current.selectObject(event, item),
    [handlers]
  )
  const beginDrag = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) =>
      handlers.current.beginDrag(event, item),
    [handlers]
  )
  const beginResize = useCallback(
    (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) =>
      handlers.current.beginResize(event, item),
    [handlers]
  )
  const updateObject = useCallback(
    (id: string, patch: BoardPatch, saveHistory?: boolean) =>
      handlers.current.updateObject(id, patch, saveHistory),
    [handlers]
  )
  const removeObject = useCallback((id: string) => handlers.current.removeObject(id), [handlers])
  const { board, selected, strokeWidth } = editor
  const { canvasRef, onWheel, zoom, pan } = viewport
  const contentObjects = board.objects.filter(isCanvasItem)
  const strokeGroups = getStrokeGroups(contentObjects)
  return (
    <ShadcnContextMenu modal={false}>
      <ContextMenuTrigger asChild>
        <div
          ref={canvasRef}
          className={`canvas-shell ${grid ? '' : 'grid-off'} ${editor.tool === 'eraser' ? 'tool-eraser' : ''} ${pointer.isErasing ? 'is-erasing' : ''} ${pointer.isPanning ? 'is-panning' : ''} ${presenting ? 'is-presenting' : ''}`}
          onWheel={presenting ? undefined : onWheel}
          onPointerDownCapture={
            presenting
              ? undefined
              : (event) => {
                  pointer.onTouchPointerDown(event)
                  if (event.defaultPrevented || editor.tool !== 'eraser') return
                  event.preventDefault()
                  event.stopPropagation()
                  pointer.beginErase(event)
                  if (event.button === 1) pointer.beginPan(event)
                }
          }
          onPointerDown={
            presenting
              ? undefined
              : (event) => {
                  if (event.target !== event.currentTarget) {
                    const target = event.target
                    // A note's rendered text is a button that opens the editor; with the
                    // pen it is just a surface to draw on, e.g. an arrow to another note.
                    const isInteractiveTarget =
                      target instanceof Element &&
                      target.closest(
                        'button:not(.markdown-preview), input, textarea, select, [contenteditable="true"]'
                      )
                    if (editor.tool === 'pen' && !isInteractiveTarget) pointer.beginDrawing(event)
                    return
                  }
                  pointer.onPointerDown(event)
                }
          }
          onPointerMoveCapture={(event) => {
            pointer.moveEraserCursor(event)
            pointer.onTouchPointerMove(event)
          }}
          onPointerMove={pointer.onPointerMove}
          onPointerUpCapture={pointer.onTouchPointerUp}
          onPointerUp={pointer.onPointerUp}
          onPointerCancelCapture={pointer.onTouchPointerUp}
          onPointerCancel={pointer.onPointerUp}
          onPointerLeave={pointer.hideEraserCursor}
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
          {editor.tool === 'eraser' && pointer.eraserCursor && (
            <div
              className={`eraser-cursor ${pointer.isErasing ? 'is-active' : ''}`}
              style={{
                left: pointer.eraserCursor.x,
                top: pointer.eraserCursor.y,
                width: editor.eraserWidth,
                height: editor.eraserWidth
              }}
              aria-hidden="true"
            />
          )}
          <div
            className="canvas-world"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition:
                pointer.isPanning || pointer.isPinching
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
                gesture={
                  pointer.drawing?.gesture?.ids.includes(item.id)
                    ? pointer.drawing.gesture.type
                    : undefined
                }
                onSelect={selectObject}
                onDrag={beginDrag}
                onResize={beginResize}
                onChange={updateObject}
                onRemove={removeObject}
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
          onScreenshot={onScreenshot}
          canEdit={selected.length > 0}
        />
      )}
    </ShadcnContextMenu>
  )
}
