import { memo, useId } from 'react'
import type React from 'react'
import { getObjectType } from './registry'
import { ResizeHandle } from './ResizeHandle'
import { WidgetFrame } from './WidgetFrame'
import type { BoardPatch, CanvasItem } from '@/features/board/types'

// Positions an object on the board and wires selection, drag and resize.
// The object body comes from the registry.
export const CanvasObject = memo(function CanvasObject({
  item,
  selected,
  activeTool,
  presentingActive,
  gesture,
  onSelect,
  onDrag,
  onResize,
  onChange,
  onRemove
}: {
  item: CanvasItem
  selected: boolean
  activeTool: string
  presentingActive: boolean
  // Pen gesture about to act on this object, shown while the pen is held.
  gesture?: 'erase' | 'select'
  onSelect: (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) => void
  onDrag: (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) => void
  onResize: (event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) => void
  onChange: (id: string, patch: BoardPatch, saveHistory?: boolean) => void
  onRemove: (id: string) => void
}) {
  const maskId = `erasures-${useId().replaceAll(':', '')}`
  const { Component, framed, className } = getObjectType(item.type)
  const content = Component && <Component item={item} onChange={onChange} selected={selected} />
  return (
    <div
      className={[
        'canvas-object',
        className,
        selected && activeTool !== 'pen' ? 'selected' : '',
        presentingActive ? 'is-presenting-active' : '',
        gesture ? `gesture-${gesture}` : ''
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: item.x,
        top: item.y,
        width: item.w,
        height: item.h,
        ...(item.erasures?.length ? { mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})` } : {})
      }}
      onPointerDown={(event) => {
        if (activeTool === 'pen') return
        onSelect(event, item)
        onDrag(event, item)
      }}
      onDoubleClick={(event) => {
        event.stopPropagation()
        onChange(item.id, { editing: true })
      }}
    >
      {framed ? (
        <WidgetFrame
          item={item}
          onDrag={onDrag}
          onRemove={onRemove}
          showTitlebar={item.type !== 'sticky' && item.type !== 'image'}
        >
          {content}
        </WidgetFrame>
      ) : (
        <>
          {content}
          {item.slide && (
            <span className="slide-marker" aria-label="Included in presentation">
              {item.slideOrder}
            </span>
          )}
        </>
      )}
      {selected && activeTool === 'select' && !item.locked && (
        <ResizeHandle item={item} onResize={onResize} />
      )}
      {item.erasures?.length ? (
        <svg
          className="eraser-mask-defs"
          width={item.w}
          height={item.h}
          viewBox={`0 0 ${item.w} ${item.h}`}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width={item.w} height={item.h}>
              <rect x="0" y="0" width={item.w} height={item.h} fill="white" />
              {item.erasures.map((mark, index) => (
                <path
                  key={index}
                  d={mark.points
                    .map((point, pointIndex) => `${pointIndex ? 'L' : 'M'} ${point.x} ${point.y}`)
                    .join(' ')}
                  fill="none"
                  stroke="black"
                  strokeWidth={mark.width}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              ))}
            </mask>
          </defs>
        </svg>
      ) : null}
    </div>
  )
})
