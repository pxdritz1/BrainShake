import type { CanvasItem, Point } from '@/features/board/types'

<<<<<<< HEAD
// Straight segments between the points, or, when `curved`, a smooth curve through
// the midpoints of each segment. Freehand strokes are drawn curved; strokes snapped
// to a shape keep their sharp corners.
export function strokePath(points: Point[], curved = false) {
  if (!curved || points.length < 3)
    return points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const last = points[points.length - 1]
  const curves = points.slice(1, -1).map((point, index) => {
    const next = points[index + 2]
    return `Q ${point.x} ${point.y} ${(point.x + next.x) / 2} ${(point.y + next.y) / 2}`
  })
  return [`M ${points[0].x} ${points[0].y}`, ...curves, `L ${last.x} ${last.y}`].join(' ')
=======
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
>>>>>>> 04c4b7e (feat(ui): atualiza visual artesanal e elementos do canvas)
}

export function StrokeObject({ item }: { item: CanvasItem }) {
  const path = strokePath(item.points || [], !item.recognizedShape)
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
