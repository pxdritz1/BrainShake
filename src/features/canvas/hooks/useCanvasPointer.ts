import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import { makeId } from '@/lib/id'
import {
  addObjects,
  connectorEndpoints,
  eraserSweepTouchesRect,
  finishStroke,
  hitTestSegment,
  moveObjects,
  patchObject,
  removeObjects,
  resizeShapeFrame,
  resizeStroke
} from '@/features/board/lib/objects'
import type { CanvasItem, EraserMark, Point } from '@/features/board/types'
import { isCanvasItem, isConnectorItem } from '@/features/board/types'
import type { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import type { useViewport } from './useViewport'
import { MAX_ZOOM, MIN_ZOOM } from './useViewport'
import { canBeginCanvasPan, shouldPanWithSpace } from '@/features/toolbar/toolNavigation'
import { recognize, UNATTENDED, type Recognition } from '@/features/pen/lib/recognize'
import { arrowLink } from '@/features/pen/lib/arrowLink'
import { recognizeGesture, type Gesture } from '@/features/pen/lib/gestures'
import { tidyStroke } from '@/features/pen/lib/geometry'

const MIN_WIDTH = 100
const MIN_HEIGHT = 80
// Holding the pen still this long at the end of a stroke snaps it to a clean shape.
const HOLD_DELAY = 500
// Screen pixels the pointer may drift while held and still count as still.
const HOLD_TOLERANCE = 6

// Pointer interactions on the canvas. `dragging.type` is one of: move | resize | pan.
// Pen strokes in progress live in `drawing`.
type Dragging =
  | {
      type: 'move'
      pointerId: number
      ids: string[]
      start: Point
      origins: (Point & { id: string })[]
    }
  | {
      type: 'resize'
      pointerId: number
      id: string
      start: Point
      x: number
      y: number
      w: number
      h: number
      direction: string
      points?: Point[]
      erasures?: EraserMark[]
      fontSize?: number
      aspectRatio?: number
    }
  | { type: 'pinch' }
  | { type: 'erase'; pointerId: number }
  | { type: 'pan'; pointerId: number; start: Point; origin: Point }

export type Drawing = CanvasItem & {
  points: Point[]
  strokeWidth: number
  // What holding the pen still turned the stroke into, applied on release: a
  // command on other objects, or else a clean shape.
  gesture?: Gesture | null
  snapped?: Recognition | null
}

export function useCanvasPointer({
  editor,
  viewport,
  autoSnap = false,
  onSnap,
  onGesture
}: {
  editor: ReturnType<typeof useBoardEditor>
  viewport: ReturnType<typeof useViewport>
  // Snap every stroke on release, not only the ones held still.
  autoSnap?: boolean
  // `linked` when an arrow was turned into a connector between two objects.
  onSnap?: (recognition: Recognition, linked: boolean) => void
  onGesture?: (gesture: Gesture) => void
}) {
  const [dragging, setDragging] = useState<Dragging | null>(null)
  const [drawing, setDrawing] = useState<Drawing | null>(null)
  const [eraserCursor, setEraserCursor] = useState<Point | null>(null)
  const spacePressed = useRef(false)
  const hold = useRef<{ timer: number; anchor: Point } | null>(null)
  const activeErasures = useRef(new Map<string, number>())
  const lastEraserPoint = useRef<Point | null>(null)
  const eraserHistoryStarted = useRef(false)
  const touchPoints = useRef(new Map<number, Point>())
  const pinch = useRef<{
    distance: number
    zoom: number
    anchor: Point
  } | null>(null)
  const { board, commit, selected, setSelected, tool, setTool, strokeWidth, eraserWidth } = editor
  const { screenPoint, pan, setPan } = viewport

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || event.repeat || isSpacePanControl(event.target)) return
      spacePressed.current = true
      event.preventDefault()
    }
    const onKeyUp = (event: KeyboardEvent) => {
      if (event.code === 'Space') spacePressed.current = false
    }
    const onBlur = () => {
      spacePressed.current = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  useEffect(() => () => window.clearTimeout(hold.current?.timer), [])

  function cancelHold() {
    if (hold.current) window.clearTimeout(hold.current.timer)
    hold.current = null
  }

  // (Re)starts the countdown to snapping. The anchor outlives the timer, so jitter
  // after a snap doesn't undo it; only moving past HOLD_TOLERANCE does.
  function startHold(event: React.PointerEvent<HTMLDivElement>) {
    cancelHold()
    hold.current = {
      anchor: { x: event.clientX, y: event.clientY },
      timer: window.setTimeout(() => {
        setDrawing((current) => {
          if (!current) return current
          const points = current.points.map((point) => ({
            x: current.x + point.x,
            y: current.y + point.y
          }))
          const gesture = recognizeGesture(points, board.objects)
          return {
            ...current,
            gesture,
            snapped: gesture || !autoSnap ? null : recognize(current.points, UNATTENDED)
          }
        })
      }, HOLD_DELAY)
    }
  }

  function isSpacePan(event: React.PointerEvent<HTMLDivElement>) {
    return shouldPanWithSpace({
      spacePressed: spacePressed.current,
      button: event.button,
      interactiveTarget: isSpacePanControl(event.target)
    })
  }

  function selectObject(event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) {
    event.stopPropagation()
    if (isSpacePan(event)) return
    if (event.button !== 0) return
    if (tool === 'connector') {
      if (!selected.length) setSelected([item.id])
      else if (selected[0] !== item.id) {
        const first = board.objects.find((object) => object.id === selected[0])
        if (first) editor.connect(first.id, item.id)
        setSelected([])
        setTool('select')
      }
      return
    }
    if (event.shiftKey || event.ctrlKey || event.metaKey)
      setSelected((current) =>
        current.includes(item.id) ? current.filter((id) => id !== item.id) : [...current, item.id]
      )
    else if (!selected.includes(item.id)) setSelected([item.id])
  }

  function beginDrag(event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) {
    if (isSpacePan(event)) {
      event.preventDefault()
      event.stopPropagation()
      beginPan(event)
      return
    }
    if (tool !== 'select' || event.button !== 0 || item.locked) return
    if (
      (event.target as Element).closest('textarea, .markdown-preview') &&
      event.button === 0 &&
      event.buttons === 1
    )
      return
    if (event.button !== 0) event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = screenPoint(event)
    const ids = selected.includes(item.id) ? selected : [item.id]
    if (!selected.includes(item.id)) setSelected([item.id])
    setDragging({
      type: 'move',
      pointerId: event.pointerId,
      ids,
      start: point,
      origins: board.objects
        .filter(isCanvasItem)
        .filter((object) => ids.includes(object.id))
        .map((object) => ({ id: object.id, x: object.x, y: object.y }))
    })
  }

  function beginResize(event: React.PointerEvent<HTMLDivElement>, item: CanvasItem) {
    event.stopPropagation()
    if (isSpacePan(event)) {
      event.preventDefault()
      beginPan(event)
      return
    }
    if (tool !== 'select' || item.locked) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = screenPoint(event)
    const direction = event.currentTarget.dataset.direction || 'se'
    setDragging({
      type: 'resize',
      pointerId: event.pointerId,
      id: item.id,
      start: point,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      direction,
      points: item.type === 'stroke' ? item.points : undefined,
      erasures: item.erasures,
      fontSize: item.type === 'text' ? item.fontSize || 18 : undefined,
      aspectRatio: item.type === 'shape' ? item.w / item.h : undefined
    })
  }

  function beginPan(event: React.PointerEvent<HTMLDivElement>) {
    if (
      !canBeginCanvasPan({
        tool,
        pointerType: event.pointerType,
        isPrimary: event.isPrimary,
        spacePressed: spacePressed.current,
        button: event.button
      })
    )
      return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    event.preventDefault()
    event.stopPropagation()
    setDragging({
      type: 'pan',
      pointerId: event.pointerId,
      start: { x: event.clientX, y: event.clientY },
      origin: pan
    })
  }

  function eraseBetween(startPoint: Point, endPoint: Point) {
    const width = eraserWidth / viewport.zoom
    const radius = width / 2
    const touched = board.objects.filter(
      (candidate): candidate is CanvasItem =>
        isCanvasItem(candidate) &&
        !candidate.locked &&
        eraserSweepTouchesRect(
          startPoint,
          endPoint,
          { x: candidate.x, y: candidate.y, w: candidate.w, h: candidate.h },
          radius
        )
    )
    const connectorIds = board.objects
      .filter(isConnectorItem)
      .filter((connector) => {
        const from = board.objects.find(
          (object): object is CanvasItem => isCanvasItem(object) && object.id === connector.from
        )
        const to = board.objects.find(
          (object): object is CanvasItem => isCanvasItem(object) && object.id === connector.to
        )
        if (!from || !to) return false
        const { start, end } = connectorEndpoints(from, to)
        const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y)
        const steps = Math.max(1, Math.ceil(distance / Math.max(1, radius)))
        return Array.from({ length: steps + 1 }, (_, index) => {
          const progress = index / steps
          return {
            x: startPoint.x + (endPoint.x - startPoint.x) * progress,
            y: startPoint.y + (endPoint.y - startPoint.y) * progress
          }
        }).some((point) => hitTestSegment(point, start, end, radius))
      })
      .map((connector) => connector.id)
    if (!touched.length && !connectorIds.length) return
    const removedIds = new Set(
      touched
        .filter((item) => item.type !== 'shape' && item.type !== 'stroke')
        .map((item) => item.id)
    )
    const maskableIds = new Set(
      touched
        .filter((item) => item.type === 'shape' || item.type === 'stroke')
        .map((item) => item.id)
    )

    const appendMark = (item: CanvasItem): CanvasItem => {
      const marks: EraserMark[] = item.erasures || []
      const activeIndex = activeErasures.current.get(item.id)
      const localEnd = { x: endPoint.x - item.x, y: endPoint.y - item.y }
      if (activeIndex !== undefined && marks[activeIndex]) {
        const active = marks[activeIndex]
        const last = active.points[active.points.length - 1]
        const points =
          last && last.x === localEnd.x && last.y === localEnd.y
            ? active.points
            : [...active.points, localEnd]
        return {
          ...item,
          erasures: marks.map((mark, index) => (index === activeIndex ? { ...mark, points } : mark))
        }
      }
      const localStart = { x: startPoint.x - item.x, y: startPoint.y - item.y }
      activeErasures.current.set(item.id, marks.length)
      return {
        ...item,
        erasures: [...marks, { points: [localStart, localEnd], width }]
      }
    }
    const connectorSet = new Set(connectorIds)
    commit(
      (current) => ({
        ...current,
        objects: current.objects
          .filter(
            (item) =>
              !connectorSet.has(item.id) &&
              !removedIds.has(item.id) &&
              !(isConnectorItem(item) && (removedIds.has(item.from) || removedIds.has(item.to)))
          )
          .map((item) => (maskableIds.has(item.id) && isCanvasItem(item) ? appendMark(item) : item))
      }),
      !eraserHistoryStarted.current
    )
    eraserHistoryStarted.current = true
  }

  function beginErase(event: React.PointerEvent<HTMLDivElement>) {
    if (tool !== 'eraser') return
    if (isSpacePan(event)) {
      beginPan(event)
      return
    }
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture?.(event.pointerId)
    activeErasures.current = new Map()
    eraserHistoryStarted.current = false
    const point = screenPoint(event)
    lastEraserPoint.current = point
    setEraserCursor({
      x: event.clientX - event.currentTarget.getBoundingClientRect().left,
      y: event.clientY - event.currentTarget.getBoundingClientRect().top
    })
    setSelected([])
    setDragging({ type: 'erase', pointerId: event.pointerId })
    eraseBetween(point, point)
  }

  function moveEraserCursor(event: React.PointerEvent<HTMLDivElement>) {
    if (tool !== 'eraser') return
    const rect = event.currentTarget.getBoundingClientRect()
    setEraserCursor({ x: event.clientX - rect.left, y: event.clientY - rect.top })
  }

  function hideEraserCursor() {
    if (dragging?.type !== 'erase') setEraserCursor(null)
  }

  function startPinch() {
    const points = [...touchPoints.current.values()].slice(0, 2)
    if (points.length < 2) return
    const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    const rect = viewport.canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    pinch.current = {
      distance: Math.max(1, Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)),
      zoom: viewport.zoom,
      anchor: {
        x: (center.x - rect.left - pan.x) / viewport.zoom,
        y: (center.y - rect.top - pan.y) / viewport.zoom
      }
    }
  }

  function onTouchPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch') return
    touchPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (touchPoints.current.size < 2) return
    event.preventDefault()
    event.stopPropagation()
    cancelHold()
    setDrawing(null)
    setDragging({ type: 'pinch' })
    startPinch()
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }

  function onTouchPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' || !touchPoints.current.has(event.pointerId)) return
    touchPoints.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (!pinch.current) return
    event.preventDefault()
    event.stopPropagation()
    const points = [...touchPoints.current.values()].slice(0, 2)
    if (points.length < 2) return
    const gesture = pinch.current
    const center = { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 }
    const distance = Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y)
    const nextZoom = Math.min(
      MAX_ZOOM,
      Math.max(MIN_ZOOM, gesture.zoom * (distance / gesture.distance))
    )
    const rect = viewport.canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    viewport.setZoom(nextZoom)
    setPan({
      x: center.x - rect.left - gesture.anchor.x * nextZoom,
      y: center.y - rect.top - gesture.anchor.y * nextZoom
    })
  }

  function onTouchPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== 'touch' || !touchPoints.current.has(event.pointerId)) return
    const wasPinching = Boolean(pinch.current)
    touchPoints.current.delete(event.pointerId)
    if (!wasPinching) return
    event.preventDefault()
    event.stopPropagation()
    if (touchPoints.current.size >= 2) startPinch()
    else {
      pinch.current = null
      setDragging(null)
      setDrawing(null)
    }
  }

  function beginDrawing(event: React.PointerEvent<HTMLDivElement>) {
    if (tool !== 'pen' || event.button !== 0) return
    setSelected([])
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const point = screenPoint(event)
    setDrawing({
      id: makeId('stroke'),
      type: 'stroke',
      x: point.x,
      y: point.y,
      w: 500,
      h: 500,
      strokeWidth,
      points: [{ x: 0, y: 0 }]
    })
    startHold(event)
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget) return
    if (isSpacePan(event)) {
      event.preventDefault()
      beginPan(event)
      return
    }
    const point = screenPoint(event)
    if (tool === 'text' || tool === 'sticky') {
      editor.addObject(tool, {}, point)
      return
    }
    setSelected([])
    beginPan(event)
    beginDrawing(event)
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (drawing) {
      const point = screenPoint(event)
      const anchor = hold.current?.anchor
      const moved =
        !anchor || Math.hypot(event.clientX - anchor.x, event.clientY - anchor.y) > HOLD_TOLERANCE
      // Moving on after a snap goes back to freehand drawing.
      if (moved) startHold(event)
      setDrawing(
        (current) =>
          current && {
            ...current,
            gesture: moved ? null : current.gesture,
            snapped: moved ? null : current.snapped,
            points: [...current.points, { x: point.x - current.x, y: point.y - current.y }]
          }
      )
      return
    }
    if (!dragging) return
    if (dragging.type === 'pinch') return
    if (event.pointerId !== dragging.pointerId) return
    if (dragging.type === 'erase') {
      const point = screenPoint(event)
      eraseBetween(lastEraserPoint.current || point, point)
      lastEraserPoint.current = point
      return
    }
    if (dragging.type === 'pan') {
      setPan({
        x: dragging.origin.x + event.clientX - dragging.start.x,
        y: dragging.origin.y + event.clientY - dragging.start.y
      })
      return
    }
    const point = screenPoint(event)
    if (dragging.type === 'resize') {
      const dx = point.x - dragging.start.x
      const dy = point.y - dragging.start.y
      const frame = dragging.aspectRatio
        ? resizeShapeFrame(
            dragging,
            dragging.direction,
            dx,
            dy,
            !event.shiftKey,
            MIN_WIDTH,
            MIN_HEIGHT
          )
        : undefined
      const left = dragging.direction.includes('w')
      const top = dragging.direction.includes('n')
      const nextW =
        frame?.w ??
        Math.max(MIN_WIDTH, dragging.w + (left ? -dx : dragging.direction.includes('e') ? dx : 0))
      const nextH =
        frame?.h ??
        Math.max(MIN_HEIGHT, dragging.h + (top ? -dy : dragging.direction.includes('s') ? dy : 0))
      const patch = {
        x: frame?.x ?? (left ? dragging.x + dragging.w - nextW : dragging.x),
        y: frame?.y ?? (top ? dragging.y + dragging.h - nextH : dragging.y),
        w: nextW,
        h: nextH,
        ...(dragging.fontSize !== undefined
          ? {
              fontSize: Math.min(
                160,
                Math.max(
                  8,
                  Math.round(
                    dragging.fontSize * Math.sqrt((nextW / dragging.w) * (nextH / dragging.h))
                  )
                )
              )
            }
          : {}),
        ...(dragging.points
          ? {
              points: resizeStroke(
                { w: dragging.w, h: dragging.h, points: dragging.points },
                nextW,
                nextH
              ).points
            }
          : {}),
        ...(dragging.erasures
          ? {
              erasures: dragging.erasures.map((mark) => ({
                ...mark,
                width: mark.width * Math.sqrt((nextW / dragging.w) * (nextH / dragging.h)),
                points: mark.points.map((sample) => ({
                  x: sample.x * (nextW / dragging.w),
                  y: sample.y * (nextH / dragging.h)
                }))
              }))
            }
          : {})
      }
      editor.updateObject(dragging.id, patch, false)
    }
    if (dragging.type === 'move')
      commit(
        (current) =>
          moveObjects(
            current,
            dragging.origins,
            point.x - dragging.start.x,
            point.y - dragging.start.y
          ),
        false
      )
  }

  function runGesture(gesture: Gesture) {
    if (gesture.type === 'erase') {
      const ids = new Set(gesture.ids)
      commit((current) => ({
        ...current,
        objects: current.objects.filter(
          (item) =>
            !ids.has(item.id) &&
            !(isConnectorItem(item) && (ids.has(item.from) || ids.has(item.to)))
        )
      }))
      setSelected((current) => current.filter((id) => !ids.has(id)))
    } else {
      setSelected(gesture.ids)
      setTool('select')
    }
    onGesture?.(gesture)
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (dragging && dragging.type !== 'pinch' && event.pointerId !== dragging.pointerId) return
    if (drawing) {
      cancelHold()
      const { gesture, snapped: held, ...stroke } = drawing
      if (gesture && event.type !== 'pointercancel') {
        runGesture(gesture)
        setDrawing(null)
        return
      }
      const snapped = autoSnap ? (held ?? recognize(stroke.points, UNATTENDED)) : null
      // The freehand version is what stays when nothing snaps, and what undo
      // brings back when something does.
      const drawn = finishStroke({ ...stroke, points: tidyStroke(stroke.points) })
      commit((current) => addObjects(current, [drawn]))
      // A separate history entry, so undo brings back the stroke as it was drawn.
      if (snapped && event.type !== 'pointercancel') {
        const [tail, tip] = snapped.points.map((point) => ({
          x: stroke.x + point.x,
          y: stroke.y + point.y
        }))
        const link = snapped.kind === 'arrow' ? arrowLink(board.objects, tail, tip) : null
        if (link) {
          // An arrow between two objects becomes a real connector.
          const [from, to] = link
          commit((current) => {
            const next = removeObjects(current, [drawn.id])
            const exists = next.objects.some(
              (item) => isConnectorItem(item) && item.from === from && item.to === to
            )
            return exists
              ? next
              : addObjects(next, [{ id: makeId('connector'), type: 'connector', from, to }])
          })
        } else {
          const { x, y, w, h, points } = finishStroke({ ...stroke, points: snapped.points })
          commit((current) =>
            patchObject(current, drawn.id, { x, y, w, h, points, recognizedShape: snapped.kind })
          )
        }
        onSnap?.(snapped, Boolean(link))
      }
      setDrawing(null)
    }
    if (dragging?.type === 'erase') lastEraserPoint.current = null
    if (event?.currentTarget?.hasPointerCapture?.(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    setDragging(null)
  }

  return {
    dragging,
    drawing,
    eraserCursor,
    isErasing: dragging?.type === 'erase',
    moveEraserCursor,
    hideEraserCursor,
    isPanning: dragging?.type === 'pan',
    isPinching: dragging?.type === 'pinch',
    selectObject,
    beginDrag,
    beginResize,
    beginDrawing,
    beginErase,
    beginPan,
    onTouchPointerDown,
    onTouchPointerMove,
    onTouchPointerUp,
    onPointerDown,
    onPointerMove,
    onPointerUp
  }
}

function isSpacePanControl(target: EventTarget | null) {
  return (
    target instanceof Element &&
    Boolean(
      target.closest(
        'button, input, textarea, select, a[href], [contenteditable], [role="textbox"], [role="button"], .markdown-preview'
      )
    )
  )
}
