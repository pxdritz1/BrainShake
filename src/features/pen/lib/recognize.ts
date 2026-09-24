import type { Point } from '@/features/board/types'
import {
  angleAt,
  bounds,
  centroid,
  distance,
  distanceToSegment,
  isClosed,
  pathLength,
  resample,
  rotate,
  simplify
} from './geometry'

export type ShapeKind =
  'line' | 'arrow' | 'rectangle' | 'square' | 'circle' | 'ellipse' | 'triangle' | 'diamond'

// `points` are the idealized outline in the same coordinates as the input stroke.
// Closed shapes repeat their first point at the end. Arrows are drawn as
// tail, tip, barb, tip, barb, so points[0] and points[1] are where they point from and to.
export type Recognition = { kind: ShapeKind; confidence: number; points: Point[] }

const SAMPLES = 64
// Strokes whose box is smaller than this (in px) are taps or dots, not shapes.
const MIN_SIZE = 16
// End-to-end distance over path length above which an open stroke is a line.
const LINE_STRAIGHTNESS = 0.92
// Same, for an arrow's shaft, which bends a little more where the head starts.
const ARROW_STRAIGHTNESS = 0.9
// Mean distance from the stroke to the fitted outline, as a fraction of the box
// diagonal, at which a fit stops counting as a match. Ellipses are held to a
// tighter bound because a rounded-off rectangle still fits one loosely.
const MAX_FIT_ERROR = { polygon: 0.045, ellipse: 0.027 }
// RDP tolerance used to find corners, as a fraction of the box diagonal.
const CORNER_TOLERANCE = 0.07
// Tilts smaller than this snap to horizontal/vertical.
const SNAP_ANGLE = (10 * Math.PI) / 180
// Degrees a hand-drawn corner may be off 90° and still count as a right angle.
const RIGHT_ANGLE_TOLERANCE = 18
// Arrow barbs are drawn this far off the shaft, like connector arrowheads.
const BARB_ANGLE = Math.PI / 6
// Interior angle (degrees) under which a stroke is doubling back on itself.
const RETRACE_ANGLE = 35
// Relative difference under which two sides are treated as equal.
const EQUAL_SIDES = 0.12

// Stricter options for snapping strokes nobody asked to snap (auto-correct), so
// handwriting (an "o", an "l") and loose doodles stay as drawn.
export const UNATTENDED = { minSize: 40, minConfidence: 0.18 }

// `minSize` and `minConfidence` let callers be stricter than the defaults, e.g.
// when snapping strokes nobody asked to snap.
export function recognize(
  stroke: Point[],
  { minSize = MIN_SIZE, minConfidence = 0 }: { minSize?: number; minConfidence?: number } = {}
): Recognition | null {
  if (stroke.length < 3) return null
  const box = bounds(stroke)
  const diagonal = Math.hypot(box.maxX - box.minX, box.maxY - box.minY)
  if (diagonal < minSize) return null
  const result = recognizeShape(stroke, diagonal)
  return result && result.confidence >= minConfidence ? result : null
}

function recognizeShape(stroke: Point[], diagonal: number): Recognition | null {
  if (!isClosed(stroke)) {
    const arrow = fitArrow(resample(stroke, SAMPLES))
    if (arrow) return arrow
  }
  const points = resample(trimRetrace(resample(stroke, SAMPLES), diagonal), SAMPLES)

  if (!isClosed(points)) {
    const straightness = distance(points[0], points[points.length - 1]) / pathLength(points)
    if (straightness < LINE_STRAIGHTNESS) return null
    return {
      kind: 'line',
      confidence: (straightness - LINE_STRAIGHTNESS) / (1 - LINE_STRAIGHTNESS),
      points: snapLine(points[0], points[points.length - 1])
    }
  }

  const corners = squareOffCorners(findCorners(points, diagonal), diagonal)
  const fit = (snap: boolean) => [
    fitEllipse(points, snap),
    corners.length === 3
      ? fitTriangle(corners, snap)
      : corners.length === 4
        ? fitQuadrilateral(corners, snap)
        : null
  ]
  // Scored at the tilt it was drawn at, so snapping a slightly tilted shape level
  // doesn't count against it; the snapped version is what gets returned.
  const [ellipse, polygon] = fit(false)
  const snapped = fit(true)

  // Pentagons, hexagons and other polygons we don't idealize would otherwise pass
  // as circles. When their own corners fit the stroke better, leave it as drawn.
  if (
    corners.length > 4 &&
    fitError(points, closePath(corners)) < fitError(points, ellipse!.points)
  )
    return null

  const candidates = [ellipse, polygon]
    .map((candidate, index) => {
      if (!candidate) return null
      const round = candidate.kind === 'circle' || candidate.kind === 'ellipse'
      const limit = round ? MAX_FIT_ERROR.ellipse : MAX_FIT_ERROR.polygon
      const confidence = 1 - fitError(points, candidate.points) / diagonal / limit
      return { ...snapped[index]!, confidence }
    })
    .filter((candidate): candidate is Recognition => candidate !== null && candidate.confidence > 0)
    .sort((a, b) => b.confidence - a.confidence)
  return candidates[0] || null
}

// Straight line between the ends, turned to the nearest 45° when it is close.
function snapLine(start: Point, end: Point): Point[] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x)
  const step = Math.PI / 4
  const snapped = Math.round(angle / step) * step
  if (Math.abs(angle - snapped) > SNAP_ANGLE) return [start, end]
  const length = distance(start, end)
  return [
    start,
    { x: start.x + length * Math.cos(snapped), y: start.y + length * Math.sin(snapped) }
  ]
}

// A straight shaft whose far end turns back into one or two short barbs.
function fitArrow(points: Point[]): Recognition | null {
  const tail = points[0]
  // A V head comes back to the tip before its second barb, so the tip is the
  // first point where the stroke, nearly as far out as it ever gets, turns back.
  const reaches = points.map((point) => distance(point, tail))
  const reach = Math.max(...reaches)
  const tipIndex = reaches.findIndex(
    (value, index) => value >= reach * 0.9 && value >= (reaches[index + 1] ?? -Infinity)
  )
  // The head needs a few samples after the tip; otherwise this is just a line.
  if (tipIndex > points.length - 4) return null
  const tip = points[tipIndex]
  const length = distance(tail, tip)
  const straightness = length / pathLength(points.slice(0, tipIndex + 1))
  const head = points.slice(tipIndex + 1)
  const headLength = pathLength([tip, ...head])
  if (straightness < ARROW_STRAIGHTNESS || headLength > length * 1.6) return null

  // Farthest point of the head on each side of the shaft.
  const back = { x: (tail.x - tip.x) / length, y: (tail.y - tip.y) / length }
  const barbs: Record<'left' | 'right', { length: number; angle: number } | null> = {
    left: null,
    right: null
  }
  for (const point of head) {
    const dx = point.x - tip.x
    const dy = point.y - tip.y
    const offset = Math.hypot(dx, dy)
    if (offset > length * 0.6) return null
    if (!offset) continue
    const side = back.x * dy - back.y * dx > 0 ? 'left' : 'right'
    const angle = Math.acos(Math.max(-1, Math.min(1, (back.x * dx + back.y * dy) / offset)))
    if (!barbs[side] || offset > barbs[side].length) barbs[side] = { length: offset, angle }
  }
  const found = [barbs.left, barbs.right].filter(
    (barb): barb is { length: number; angle: number } =>
      barb !== null &&
      barb.length > length * 0.08 &&
      barb.angle > degrees(10) &&
      barb.angle < degrees(80)
  )
  if (!found.length) return null

  const [start, end] = snapLine(tail, tip)
  const barbLength = Math.min(
    length * 0.4,
    Math.max(length * 0.1, found.reduce((sum, barb) => sum + barb.length, 0) / found.length)
  )
  const direction = Math.atan2(start.y - end.y, start.x - end.x)
  const barb = (angle: number) => ({
    x: end.x + barbLength * Math.cos(direction + angle),
    y: end.y + barbLength * Math.sin(direction + angle)
  })
  return {
    kind: 'arrow',
    confidence: (straightness - ARROW_STRAIGHTNESS) / (1 - ARROW_STRAIGHTNESS),
    points: [start, end, barb(BARB_ANGLE), end, barb(-BARB_ANGLE)]
  }
}

function degrees(value: number) {
  return (value * Math.PI) / 180
}

// Angle folded into (-45°, 45°]: how far a direction is from the nearest axis.
function foldTilt(angle: number) {
  const quarter = Math.PI / 2
  const tilt = angle - Math.round(angle / quarter) * quarter
  return tilt <= -Math.PI / 4 ? tilt + quarter : tilt
}

// Tilt to draw a fitted shape at: 0 when snapping and it is nearly axis-aligned.
function snapTilt(angle: number, snap = true) {
  const tilt = foldTilt(angle)
  return snap && Math.abs(tilt) < SNAP_ANGLE ? 0 : tilt
}

function fitEllipse(points: Point[], snap: boolean): Recognition {
  const center = centroid(points)
  // Principal axis of the points gives the ellipse's orientation.
  let xx = 0
  let yy = 0
  let xy = 0
  for (const point of points) {
    const dx = point.x - center.x
    const dy = point.y - center.y
    xx += dx * dx
    yy += dy * dy
    xy += dx * dy
  }
  const tilt = snapTilt(0.5 * Math.atan2(2 * xy, xx - yy), snap)
  const aligned = rotate(points, -tilt, center)
  // The bounding box sizes the ellipse well for round strokes but overshoots on
  // pointy ones (a leaf, a lemon); the spread of the points does the opposite.
  // Keep whichever follows the stroke more closely.
  const box = bounds(aligned)
  const spread = (axis: 'x' | 'y') =>
    Math.sqrt(
      (2 * aligned.reduce((sum, point) => sum + (point[axis] - center[axis]) ** 2, 0)) /
        aligned.length
    )
  const [best] = [
    {
      middle: { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 },
      rx: (box.maxX - box.minX) / 2,
      ry: (box.maxY - box.minY) / 2
    },
    { middle: center, rx: spread('x'), ry: spread('y') }
  ]
    .map(({ middle, rx, ry }) => {
      const round = Math.abs(rx - ry) / Math.max(rx, ry) < EQUAL_SIDES
      if (round) rx = ry = (rx + ry) / 2
      const outline = Array.from({ length: SAMPLES + 1 }, (_, index) => {
        const t = (index / SAMPLES) * 2 * Math.PI
        return { x: middle.x + rx * Math.cos(t), y: middle.y + ry * Math.sin(t) }
      })
      return { round, outline, error: fitError(aligned, outline) }
    })
    .sort((a, b) => a.error - b.error)
  return {
    kind: best.round ? 'circle' : 'ellipse',
    confidence: 0,
    points: rotate(best.outline, tilt, center)
  }
}

// Corners of a closed stroke, in drawing order.
function findCorners(points: Point[], diagonal: number): Point[] {
  let corners = simplify(trimOverlap(points), diagonal * CORNER_TOLERANCE)
  if (corners.length < 3) return corners
  const first = corners[0]
  const last = corners[corners.length - 1]
  // If the ends stopped around a corner, the first and last sides, extended,
  // meet at it. Ends on the same side give parallel lines and no nearby meeting.
  const meet = intersection(corners[1], first, corners[corners.length - 2], last)
  if (meet && Math.max(distance(meet, first), distance(meet, last)) < diagonal * 0.35) {
    corners.pop()
    corners[0] = meet
  } else if (distance(first, last) < diagonal * 0.1) corners.pop()

  // Drop vertices that sit on a straight run or right next to another vertex.
  let changed = true
  while (changed && corners.length > 2) {
    changed = false
    for (let index = 0; index < corners.length; index++) {
      const previous = corners[(index - 1 + corners.length) % corners.length]
      const next = corners[(index + 1) % corners.length]
      if (
        angleAt(previous, corners[index], next) > 150 ||
        distanceToSegment(corners[index], previous, next) < diagonal * CORNER_TOLERANCE ||
        distance(previous, corners[index]) < diagonal * 0.1
      ) {
        corners = corners.filter((_, other) => other !== index)
        changed = true
        break
      }
    }
  }
  return corners
}

// A corner drawn rounded shows up as two vertices joined by a short side.
// Replace that side with the point where its neighboring sides meet.
function squareOffCorners(corners: Point[], diagonal: number): Point[] {
  let result = corners
  while (result.length > 4) {
    const count = result.length
    const lengths = result.map((corner, index) => distance(corner, result[(index + 1) % count]))
    const median = [...lengths].sort((a, b) => a - b)[Math.floor(count / 2)]
    const shortest = lengths.indexOf(Math.min(...lengths))
    // Evenly sized sides mean a real polygon (pentagon, hexagon), not a rounded one.
    if (lengths[shortest] > median * 0.6) break
    const a = result[shortest]
    const b = result[(shortest + 1) % count]
    const meet = intersection(
      result[(shortest - 1 + count) % count],
      a,
      result[(shortest + 2) % count],
      b
    )
    if (!meet || Math.max(distance(meet, a), distance(meet, b)) > diagonal * 0.25) break
    result = result
      .map((corner, index) => (index === shortest ? meet : corner))
      .filter((_, index) => index !== (shortest + 1) % count)
  }
  return result
}

// Drops a stretch at either end that the stroke immediately draws back over, as
// when a rectangle is started mid-side, drawn down, then back up the same side.
function trimRetrace(points: Point[], diagonal: number): Point[] {
  const vertices = simplify(points, diagonal * CORNER_TOLERANCE)
  if (vertices.length < 3) return points
  const total = pathLength(points)
  const last = vertices.length - 1
  let start = 0
  let end = points.length - 1
  if (angleAt(vertices[0], vertices[1], vertices[2]) < RETRACE_ANGLE) {
    const index = points.indexOf(vertices[1])
    if (pathLength(points.slice(0, index + 1)) < total * 0.35) start = index
  }
  if (angleAt(vertices[last - 2], vertices[last - 1], vertices[last]) < RETRACE_ANGLE) {
    const index = points.indexOf(vertices[last - 1])
    if (pathLength(points.slice(index)) < total * 0.35) end = index
  }
  return end - start >= 2 ? points.slice(start, end + 1) : points
}

// Cuts the tail of a stroke that runs past its start, at the point where it
// comes closest to the start.
function trimOverlap(points: Point[]) {
  let end = points.length - 1
  for (let index = Math.floor(points.length * 0.7); index < points.length; index++)
    if (distance(points[index], points[0]) < distance(points[end], points[0])) end = index
  return points.slice(0, end + 1)
}

// Where the line through a and b crosses the line through c and d.
function intersection(a: Point, b: Point, c: Point, d: Point): Point | null {
  const denominator = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x)
  if (Math.abs(denominator) < 1e-9) return null
  const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / denominator
  return { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) }
}

function fitTriangle(corners: Point[], snap: boolean): Recognition {
  const center = centroid(corners)
  // Work in the frame where the side closest to an axis is level.
  const tilts = corners.map((corner, index) => {
    const next = corners[(index + 1) % 3]
    return foldTilt(Math.atan2(next.y - corner.y, next.x - corner.x))
  })
  const base = tilts.reduce(
    (best, value, index) => (Math.abs(value) < Math.abs(tilts[best]) ? index : best),
    0
  )
  const vertices = rotate(corners, -tilts[base], center)
  const a = vertices[base]
  const b = vertices[(base + 1) % 3]
  const apex = vertices[(base + 2) % 3]
  const axis = Math.abs(a.x - b.x) > Math.abs(a.y - b.y) ? 'x' : 'y'
  const across = axis === 'x' ? 'y' : 'x'
  a[across] = b[across] = (a[across] + b[across]) / 2
  // Center the apex over the base (isosceles) when it is almost centered.
  const middle = (a[axis] + b[axis]) / 2
  if (Math.abs(apex[axis] - middle) < Math.abs(a[axis] - b[axis]) * EQUAL_SIDES) apex[axis] = middle
  // Keep the drawn tilt unless it was close enough to level to snap.
  const tilt = snap && Math.abs(tilts[base]) < SNAP_ANGLE ? 0 : tilts[base]
  return { kind: 'triangle', confidence: 0, points: closePath(rotate(vertices, tilt, center)) }
}

function fitQuadrilateral(corners: Point[], snap: boolean): Recognition | null {
  const center = centroid(corners)
  const rightAngles = corners.every((corner, index) => {
    const angle = angleAt(corners[(index + 3) % 4], corner, corners[(index + 1) % 4])
    return Math.abs(angle - 90) < RIGHT_ANGLE_TOLERANCE
  })

  if (rightAngles) {
    // Average edge direction folded into a quarter turn gives the rectangle's tilt.
    let sin = 0
    let cos = 0
    corners.forEach((corner, index) => {
      const next = corners[(index + 1) % 4]
      const angle = Math.atan2(next.y - corner.y, next.x - corner.x)
      const length = distance(corner, next)
      sin += length * Math.sin(4 * angle)
      cos += length * Math.cos(4 * angle)
    })
    const drawn = foldTilt(Math.atan2(sin, cos) / 4)
    // A square turned about 45° reads as a diamond.
    if (Math.abs(Math.abs(drawn) - Math.PI / 4) < SNAP_ANGLE) return diamond(corners)
    const tilt = snapTilt(drawn, snap)
    const box = sideBounds(rotate(corners, -tilt, center))
    let width = box.maxX - box.minX
    let height = box.maxY - box.minY
    const square = Math.abs(width - height) / Math.max(width, height) < EQUAL_SIDES
    if (square) width = height = (width + height) / 2
    const middle = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 }
    const outline = [
      { x: middle.x - width / 2, y: middle.y - height / 2 },
      { x: middle.x + width / 2, y: middle.y - height / 2 },
      { x: middle.x + width / 2, y: middle.y + height / 2 },
      { x: middle.x - width / 2, y: middle.y + height / 2 }
    ]
    return {
      kind: square ? 'square' : 'rectangle',
      confidence: 0,
      points: closePath(rotate(outline, tilt, center))
    }
  }

  // Not a rectangle: accept a rhombus whose diagonals are close to the axes.
  const diagonals = [
    [corners[0], corners[2]],
    [corners[1], corners[3]]
  ]
  const aligned = diagonals.every(([a, b]) => snapTilt(Math.atan2(b.y - a.y, b.x - a.x)) === 0)
  const [first, second] = diagonals.map(([a, b]) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }))
  const box = bounds(corners)
  const crossing =
    distance(first, second) < Math.hypot(box.maxX - box.minX, box.maxY - box.minY) * 0.15
  return aligned && crossing ? diamond(corners) : null
}

function diamond(corners: Point[]): Recognition {
  const box = bounds(corners)
  const middle = { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 }
  return {
    kind: 'diamond',
    confidence: 0,
    points: closePath([
      { x: middle.x, y: box.minY },
      { x: box.maxX, y: middle.y },
      { x: middle.x, y: box.maxY },
      { x: box.minX, y: middle.y }
    ])
  }
}

// Box of an axis-aligned quadrilateral, taking each side as the mean of the two
// corners nearest to it, so a single overshooting corner doesn't widen the shape.
function sideBounds(corners: Point[]) {
  const byX = [...corners].sort((a, b) => a.x - b.x)
  const byY = [...corners].sort((a, b) => a.y - b.y)
  return {
    minX: (byX[0].x + byX[1].x) / 2,
    maxX: (byX[2].x + byX[3].x) / 2,
    minY: (byY[0].y + byY[1].y) / 2,
    maxY: (byY[2].y + byY[3].y) / 2
  }
}

function closePath(points: Point[]) {
  return [...points, { ...points[0] }]
}

// Mean distance from each stroke point to the nearest segment of `outline`.
function fitError(points: Point[], outline: Point[]) {
  let total = 0
  for (const point of points) {
    let nearest = Infinity
    for (let index = 1; index < outline.length; index++)
      nearest = Math.min(nearest, distanceToSegment(point, outline[index - 1], outline[index]))
    total += nearest
  }
  return total / points.length
}
