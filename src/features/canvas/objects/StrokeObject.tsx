import type { CanvasItem, Point } from '@/features/board/types'

export function strokePath(points: Point[]) {
  if (points.length < 3) {
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  }
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index]
    const next = points[index + 1]
    const middleX = (current.x + next.x) / 2
    const middleY = (current.y + next.y) / 2
    path += ` Q ${current.x} ${current.y} ${middleX} ${middleY}`
  }
  const last = points[points.length - 1]
  path += ` Q ${last.x} ${last.y} ${last.x} ${last.y}`
  return path
}

export function StrokeObject({ item }: { item: CanvasItem }) {
  const path = strokePath(item.points || [])
  return (
    <svg className="stroke" viewBox={`0 0 ${item.w} ${item.h}`}>
      <path
        className="stroke-hit-area"
        style={{ strokeWidth: (item.strokeWidth || 4) + 10 }}
        d={path}
      />
      <path
        style={{ stroke: item.strokeColor || undefined, strokeWidth: item.strokeWidth || 4 }}
        d={path}
      />
    </svg>
  )
}
