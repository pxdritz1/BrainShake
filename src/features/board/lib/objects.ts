import { makeId } from '@/lib/id'
import type { Board, BoardItem, BoardPatch, CanvasItem, Point } from '../types'

export function normalizeShape(item: BoardItem): BoardItem {
  if (item.type !== 'shape' || !('x' in item) || !('y' in item)) return item
  if (!Number.isFinite(item.w) || !Number.isFinite(item.h) || item.w <= 0 || item.h <= 0)
    return item

  const size = Math.min(item.w, item.h)
  if (item.w === size && item.h === size) return item
  const centerX = item.x + item.w / 2
  const centerY = item.y + item.h / 2
  return { ...item, x: centerX - size / 2, y: centerY - size / 2, w: size, h: size }
}

export function normalizeBoardShapes(board: Board): Board {
  let changed = false
  const objects = board.objects.map((item) => {
    const normalized = normalizeShape(item)
    if (normalized !== item) changed = true
    return normalized
  })
  return changed ? { ...board, objects } : board
}

export function hitTestObject(item: CanvasItem, point: Point, tolerance = 0): boolean {
  if (item.type !== 'stroke' || !item.points?.length) {
    return (
      point.x >= item.x - tolerance &&
      point.x <= item.x + item.w + tolerance &&
      point.y >= item.y - tolerance &&
      point.y <= item.y + item.h + tolerance
    )
  }

  const radius = tolerance + (item.strokeWidth || 4) / 2
  const radiusSquared = radius * radius
  const points = item.points.map((sample) => ({ x: item.x + sample.x, y: item.y + sample.y }))
  if (points.length === 1)
    return (points[0].x - point.x) ** 2 + (points[0].y - point.y) ** 2 <= radiusSquared
  return points.slice(1).some((end, index) => {
    const start = points[index]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const lengthSquared = dx * dx + dy * dy
    const projection = lengthSquared
      ? Math.max(
          0,
          Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared)
        )
      : 0
    const nearestX = start.x + projection * dx
    const nearestY = start.y + projection * dy
    return (point.x - nearestX) ** 2 + (point.y - nearestY) ** 2 <= radiusSquared
  })
}

export function resizeShapeFrame(
  frame: { x: number; y: number; w: number; h: number },
  direction: string,
  dx: number,
  dy: number,
  keepAspect: boolean,
  minWidth = 100,
  minHeight = 80
) {
  const west = direction.includes('w')
  const east = direction.includes('e')
  const north = direction.includes('n')
  const south = direction.includes('s')
  const horizontal = west || east
  const vertical = north || south
  const requestedWidth = Math.max(minWidth, frame.w + (west ? -dx : east ? dx : 0))
  const requestedHeight = Math.max(minHeight, frame.h + (north ? -dy : south ? dy : 0))
  let w = requestedWidth
  let h = requestedHeight

  if (keepAspect) {
    const widthScale = requestedWidth / frame.w
    const heightScale = requestedHeight / frame.h
    const scale = Math.max(
      minWidth / frame.w,
      minHeight / frame.h,
      horizontal && vertical
        ? Math.abs(widthScale - 1) >= Math.abs(heightScale - 1)
          ? widthScale
          : heightScale
        : horizontal
          ? widthScale
          : heightScale
    )
    w = frame.w * scale
    h = frame.h * scale
  }

  const widthChange = w - frame.w
  const heightChange = h - frame.h
  return {
    x: west ? frame.x - widthChange : east ? frame.x : frame.x - widthChange / 2,
    y: north ? frame.y - heightChange : south ? frame.y : frame.y - heightChange / 2,
    w,
    h
  }
}

// `data` must include the size (w/h); see defaultSize in the canvas object registry.
export function createObject(
  type: string,
  data: Partial<CanvasItem> & Pick<CanvasItem, 'w' | 'h'>,
  point: Point
): CanvasItem {
  return {
    id: makeId(type),
    type,
    x: point.x - 130,
    y: point.y - 90,
    color: 'yellow',
    text: '',
    ...data
  }
}

export function finishStroke(stroke: CanvasItem & { points: Point[]; strokeWidth: number }) {
  const padding = (stroke.strokeWidth || 4) / 2
  const bounds = stroke.points.reduce(
    (result, point) => ({
      minX: Math.min(result.minX, point.x),
      minY: Math.min(result.minY, point.y),
      maxX: Math.max(result.maxX, point.x),
      maxY: Math.max(result.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )
  const minX = bounds.minX - padding
  const minY = bounds.minY - padding
  return {
    ...stroke,
    x: stroke.x + minX,
    y: stroke.y + minY,
    w: Math.max(stroke.strokeWidth || 4, bounds.maxX - minX + padding),
    h: Math.max(stroke.strokeWidth || 4, bounds.maxY - minY + padding),
    points: stroke.points.map((point) => ({ x: point.x - minX, y: point.y - minY }))
  }
}

export type StrokeBounds = { minX: number; minY: number; maxX: number; maxY: number }

export function resizeStroke(
  stroke: Pick<CanvasItem, 'w' | 'h' | 'points'>,
  width: number,
  height: number
) {
  const scaleX = width / stroke.w
  const scaleY = height / stroke.h
  return {
    w: width,
    h: height,
    points: (stroke.points || []).map((point) => ({
      x: point.x * scaleX,
      y: point.y * scaleY
    }))
  }
}

export function getStrokeBounds(stroke: CanvasItem): StrokeBounds | null {
  if (stroke.type !== 'stroke' || !stroke.points?.length) return null
  const padding = (stroke.strokeWidth || 4) / 2
  const points = stroke.points
  const bounds = points.reduce(
    (result, point) => ({
      minX: Math.min(result.minX, point.x),
      minY: Math.min(result.minY, point.y),
      maxX: Math.max(result.maxX, point.x),
      maxY: Math.max(result.maxY, point.y)
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )
  return {
    minX: stroke.x + bounds.minX - padding,
    minY: stroke.y + bounds.minY - padding,
    maxX: stroke.x + bounds.maxX + padding,
    maxY: stroke.y + bounds.maxY + padding
  }
}

export function getStrokeGroups(strokes: CanvasItem[], gap = 18) {
  const items = strokes.filter((stroke) => stroke.type === 'stroke' && stroke.points?.length)
  const bounds = new Map(items.map((stroke) => [stroke.id, getStrokeBounds(stroke)!]))
  const groups: CanvasItem[][] = []
  const visited = new Set<string>()

  for (const stroke of items) {
    if (visited.has(stroke.id)) continue
    const group: CanvasItem[] = []
    const queue = [stroke]
    visited.add(stroke.id)
    while (queue.length) {
      const current = queue.shift()!
      group.push(current)
      const currentBounds = bounds.get(current.id)!
      for (const candidate of items) {
        if (visited.has(candidate.id)) continue
        const candidateBounds = bounds.get(candidate.id)!
        const separated =
          currentBounds.maxX + gap < candidateBounds.minX ||
          candidateBounds.maxX + gap < currentBounds.minX ||
          currentBounds.maxY + gap < candidateBounds.minY ||
          candidateBounds.maxY + gap < currentBounds.minY
        if (!separated) {
          visited.add(candidate.id)
          queue.push(candidate)
        }
      }
    }
    groups.push(group)
  }
  return groups
}

export function addObjects(board: Board, items: BoardItem[]): Board {
  return { ...board, objects: [...board.objects, ...items.map(normalizeShape)] }
}

export function patchObject(board: Board, id: string, patch: BoardPatch): Board {
  return {
    ...board,
    objects: board.objects.map((item) => (item.id === id ? { ...item, ...patch } : item))
  }
}

export function moveObjects(
  board: Board,
  origins: (Point & { id: string })[],
  dx: number,
  dy: number
): Board {
  return {
    ...board,
    objects: board.objects.map((item) => {
      const origin = origins.find((value) => value.id === item.id)
      return origin && 'x' in item ? { ...item, x: origin.x + dx, y: origin.y + dy } : item
    })
  }
}

export function removeObjects(board: Board, ids: string[]): Board {
  return { ...board, objects: board.objects.filter((item) => !ids.includes(item.id)) }
}

export function duplicateObjects(items: BoardItem[], offset: number): BoardItem[] {
  return items.map((item) => ({
    ...item,
    id: makeId(item.type),
    ...('x' in item ? { x: item.x + offset, y: item.y + offset } : {})
  }))
}

export function bringToFront(board: Board, ids: string[]): Board {
  return {
    ...board,
    objects: [
      ...board.objects.filter((item) => !ids.includes(item.id)),
      ...board.objects.filter((item) => ids.includes(item.id))
    ]
  }
}
