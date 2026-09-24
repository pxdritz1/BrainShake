import type { Point } from '@/features/board/types'
import {
  bounds,
  centroid,
  distance,
  distanceToSegment,
  pathLength,
  resample,
  rotate
} from './geometry'
import {
  areaMoments,
  convexHull,
  cornerTurns,
  largestPolygon,
  minAreaRect,
  polygonArea,
  polygonPerimeter,
  unstretch
} from './hull'

// Every shape in the toolbar's shape menu, plus the arrow.
export type ShapeKind =
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'ellipse'
  | 'triangle'
  | 'diamond'
  | 'pentagon'
  | 'hexagon'
  | 'star'

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
// Tilts smaller than this snap to horizontal/vertical.
const SNAP_ANGLE = (12 * Math.PI) / 180
// Arrow barbs are drawn this far off the shaft, like connector arrowheads.
const BARB_ANGLE = Math.PI / 6
// Relative difference under which two sides are treated as equal.
const EQUAL_SIDES = 0.12

// Closed strokes are classified by how their convex hull compares with shapes
// inscribed in or wrapped around it (as in the CALI recognizer). These ratios
// don't change when a shape is stretched or turned, and a hull ignores the hooks,
// tails, overlaps and wobble of quick drawing.
// Largest inscribed quadrilateral over hull area: 2/π for any ellipse, 1 for any
// quadrilateral. Rounded strokes stay below this.
const ROUND_BELOW = 0.8
// Largest inscribed triangle over hull area: 1 for a triangle, at most 0.5 for
// quadrilaterals and 0.41 for ellipses.
const TRIANGLE_ABOVE = 0.72
// Hull area over its smallest enclosing rectangle: 1 for rectangles, about 0.75
// for diamonds and trapezoids.
const RECTANGLE_ABOVE = 0.85
// Stroke area over hull area. Hearts, moons and other concave outlines fall below
// (stars are recognized before this is checked).
const MIN_SOLIDITY = 0.72
// Stroke length over hull perimeter. Loops drawn several times, spirals and
// scribbles go above.
const MAX_WINDING = 1.35
// How far (as a share of the size) the outline may dip in from its hull. Deeper
// dents make a heart, a moon or a bean, not a hand-drawn ellipse.
const MAX_DENT = 0.14
// Loops with this many dents over SMALL_DENT deep are scalloped, not wobbly.
const SMALL_DENT = 0.065
const MAX_SMALL_DENTS = 4
// A rounded or wobbly polygon can fall short of the ratios above, so corners are
// also counted from how the hull turns: a stroke has n corners when its n-th
// sharpest spot turns at least 40% as much as a regular n-gon's corner, and the
// next one at most this share of that. A circle turns about evenly all around.
const CORNER_CONTRAST = 0.5
const CORNER_SHARPNESS = 0.4
// How far (as a share of the even gap) the angle between neighboring corners of
// a pentagon or hexagon may be off.
const UNEVEN_CORNERS = 0.4
// A star's inner points, as a share of its outer radius (as in the toolbar's star).
const STAR_INNER = 0.38
// Average distance (as a share of the star's radius) a drawn star may stray from
// straight sides.
const STAR_SLACK = 0.1

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
  const points = resample(stroke, SAMPLES)
  // Arrows first: a long barb can reach back close enough to the shaft to look
  // like a closed stroke, and no closed shape has a straight shaft with a short head.
  const arrow = fitArrow(points)
  const loop = arrow ? null : closedLoop(points, diagonal)
  const result = arrow ?? (loop ? fitClosed(points, loop) : fitLine(points))
  return result && result.confidence >= minConfidence ? result : null
}

// The part of the stroke that goes around once, or null when the stroke doesn't
// come back to where it started: some point near its end must pass close to some
// point near its start. Unlike comparing just the two ends, this also holds when
// the end overshoots the start or curls in past it. A gap of up to 15% of the
// stroke still counts; a "C" leaves about 30% open. The loop runs between the
// closest such pair, leaving out hooks before it and tails after it.
function closedLoop(points: Point[], diagonal: number): Point[] | null {
  const reach = Math.floor(points.length / 4)
  const gap = Math.max(diagonal * 0.2, pathLength(points) * 0.15)
  let closest = { from: 0, to: 0, apart: gap }
  for (let from = 0; from < reach; from++)
    for (let to = points.length - reach; to < points.length; to++) {
      const apart = distance(points[from], points[to])
      if (apart < closest.apart) closest = { from, to, apart }
    }
  return closest.to ? points.slice(closest.from, closest.to + 1) : null
}

function fitLine(points: Point[]): Recognition | null {
  const straightness = distance(points[0], points[points.length - 1]) / pathLength(points)
  if (straightness < LINE_STRAIGHTNESS) return null
  return {
    kind: 'line',
    confidence: (straightness - LINE_STRAIGHTNESS) / (1 - LINE_STRAIGHTNESS),
    points: snapLine(points[0], points[points.length - 1])
  }
}

function fitClosed(points: Point[], loop: Point[]): Recognition | null {
  const hull = convexHull(points)
  const area = polygonArea(hull)
  const box = minAreaRect(hull)
  // A line drawn there and back has no inside to classify.
  if (!area || Math.min(box.width, box.height) < Math.max(box.width, box.height) * 0.1) return null
  // A star is concave and a pentagram crosses itself, so they come before the
  // checks that turn such strokes away.
  const star = fitStar(points, hull, area)
  if (star) return star
  if (polygonArea(points) / area < MIN_SOLIDITY) return null
  if (pathLength(points) / polygonPerimeter(hull) > MAX_WINDING) return null
  if (dented(loop)) return null

  const triangle = largestPolygon(hull, 3)
  const quadrilateral = largestPolygon(hull, 4)
  const triangleShare = polygonArea(triangle) / area
  const quadrilateralShare = polygonArea(quadrilateral) / area
  const fill = area / (box.width * box.height)
  const corners = countCorners(hull)

  if (triangleShare >= TRIANGLE_ABOVE)
    return { ...fitTriangle(triangle), confidence: margin(triangleShare, TRIANGLE_ABOVE, 0.2) }
  if (corners.count === 3) return { ...fitTriangle(triangle), confidence: corners.confidence }
  if (quadrilateralShare < ROUND_BELOW && corners.count !== 4) {
    if (corners.count === 5)
      return {
        ...fitRegular('pentagon', largestPolygon(hull, 5), PENTAGON, 5),
        confidence: corners.confidence
      }
    if (corners.count === 6)
      return {
        ...fitRegular('hexagon', largestPolygon(hull, 6), HEXAGON, 6),
        confidence: corners.confidence
      }
    return { ...fitRound(hull), confidence: margin(ROUND_BELOW - quadrilateralShare, 0, 0.12) }
  }
  // A diamond: its diagonals run close to horizontal and vertical. (A rectangle's
  // diagonals mirror each other instead, and a wide one has both nearly level.)
  const [across, down] = [
    [quadrilateral[0], quadrilateral[2]],
    [quadrilateral[1], quadrilateral[3]]
  ]
    .map(([a, b]) => Math.atan2(b.y - a.y, b.x - a.x))
    .map((angle) => Math.abs(Math.sin(angle)))
    .sort((a, b) => a - b)
  const cornered = corners.count === 4 ? corners.confidence : 0
  if (across < Math.sin(SNAP_ANGLE * 1.5) && down > Math.cos(SNAP_ANGLE * 1.5))
    return {
      ...diamond(quadrilateral),
      confidence: Math.max(cornered, margin(quadrilateralShare, ROUND_BELOW, 0.12))
    }
  if (fill >= RECTANGLE_ABOVE)
    return {
      ...fitRectangle(box, fill),
      confidence: Math.max(cornered, margin(fill, RECTANGLE_ABOVE, 0.1))
    }
  return null
}

function margin(value: number, from: number, span: number) {
  return Math.max(0, Math.min(1, (value - from) / span))
}

// How many clear corners (3 to 6) the hull has, or 0 when it has none. The hull is
// unstretched first, so an ellipse's pointed ends don't count as corners, and any
// triangle or parallelogram comes out even. Five or six corners must also be
// spread evenly, like the toolbar's pentagon and hexagon, so a bump on a box or
// the notch of a heart doesn't make one.
function countCorners(hull: Point[]) {
  const turns = cornerTurns(convexHull(unstretch(hull)))
  let count = 0
  let contrast = CORNER_CONTRAST
  for (let sides = 3; sides <= 6; sides++) {
    const ratio = turns[sides].share / turns[sides - 1].share
    if (turns[sides - 1].share < CORNER_SHARPNESS / sides || ratio > contrast) continue
    if (sides > 4 && !evenlySpread(turns.slice(0, sides).map((turn) => turn.at))) continue
    count = sides
    contrast = ratio
  }
  return { count, confidence: margin(CORNER_CONTRAST - contrast, 0, 0.3) }
}

// Whether points sit around their center at about even angles.
function evenlySpread(points: Point[]) {
  const center = centroid(points)
  const angles = points
    .map((point) => Math.atan2(point.y - center.y, point.x - center.x))
    .sort((a, b) => a - b)
  const even = (2 * Math.PI) / points.length
  return angles.every((angle, index) => {
    const gap = index ? angle - angles[index - 1] : angle + 2 * Math.PI - angles[angles.length - 1]
    return Math.abs(gap - even) < even * UNEVEN_CORNERS
  })
}

// Five even points around the center, reached one after another with the
// stroke dipping toward the center in between: drawn as an outline or as a
// pentagram in one go.
function fitStar(points: Point[], hull: Point[], area: number): Recognition | null {
  const tips = largestPolygon(hull, 5)
  // The hull is just the five tips.
  const share = polygonArea(tips) / area
  if (share < 0.9) return null
  const center = centroid(tips)
  const reach = tips.map((tip) => distance(tip, center))
  if (Math.min(...reach) < Math.max(...reach) * 0.6) return null
  const angles = tips
    .map((tip) => Math.atan2(tip.y - center.y, tip.x - center.x))
    .sort((a, b) => a - b)
  const gaps = angles.map((angle, index) =>
    index ? angle - angles[index - 1] : angle + 2 * Math.PI - angles[angles.length - 1]
  )
  if (gaps.some((gap) => Math.abs(gap - degrees(72)) > degrees(30))) return null
  // Runs of the stroke out at the tips and in near the center, in drawing order.
  const radius = reach.reduce((sum, value) => sum + value, 0) / reach.length
  const runs: ('out' | 'in')[] = []
  for (const point of points) {
    const from = distance(point, center)
    const place = from >= radius * 0.75 ? 'out' : from <= radius * 0.6 ? 'in' : null
    if (place && place !== runs[runs.length - 1]) runs.push(place)
  }
  const inward = runs.filter((run) => run === 'in').length
  const outward = runs.length - inward
  if (inward < 4 || inward > 6 || outward < 5 || outward > 6) return null
  // Straight sides: each point lies close to the ideal star's outline or, for a
  // pentagram, to a line between two tips. Five round petals don't.
  const star = fitRegular('star', tips, STAR, 5)
  const lines = [
    ...star.points.slice(1).map((point, index) => [star.points[index], point]),
    ...tips.map((tip, index) => [tip, tips[(index + 2) % 5]])
  ]
  const off =
    points.reduce(
      (sum, point) => sum + Math.min(...lines.map(([a, b]) => distanceToSegment(point, a, b))),
      0
    ) / points.length
  if (off > radius * STAR_SLACK) return null
  return { ...star, confidence: margin(share, 0.9, 0.06) }
}

// Outlines of the toolbar's shapes around the origin, with their first point at
// radius 1 in the direction the toolbar draws it.
const regularPolygon = (
  sides: number,
  start: number,
  radius: (index: number) => number = () => 1
) =>
  Array.from({ length: sides }, (_, index) => {
    const angle = start + (index / sides) * 2 * Math.PI
    return { x: radius(index) * Math.cos(angle), y: radius(index) * Math.sin(angle) }
  })
const PENTAGON = regularPolygon(5, -Math.PI / 2)
const HEXAGON = regularPolygon(6, 0)
const STAR = regularPolygon(10, -Math.PI / 2, (index) => (index % 2 ? STAR_INNER : 1))

// `outline` placed over the drawn `corners` (a star's tips): turned like them,
// or upright when close, and stretched to their extent, evenly when close.
// `symmetry` is how many turns map the outline onto itself.
function fitRegular(
  kind: ShapeKind,
  corners: Point[],
  outline: Point[],
  symmetry: number
): Recognition {
  const center = centroid(corners)
  const start = Math.atan2(outline[0].y, outline[0].x)
  let sin = 0
  let cos = 0
  for (const corner of corners) {
    const angle = symmetry * (Math.atan2(corner.y - center.y, corner.x - center.x) - start)
    sin += Math.sin(angle)
    cos += Math.cos(angle)
  }
  const turn = Math.atan2(sin, cos) / symmetry
  const tilt = Math.abs(turn) < SNAP_ANGLE ? 0 : turn
  const drawn = bounds(rotate(corners, -tilt, center))
  const model = bounds(outline.filter((point) => Math.hypot(point.x, point.y) > 0.99))
  let scaleX = (drawn.maxX - drawn.minX) / (model.maxX - model.minX)
  let scaleY = (drawn.maxY - drawn.minY) / (model.maxY - model.minY)
  if (Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY) < EQUAL_SIDES)
    scaleX = scaleY = (scaleX + scaleY) / 2
  const placed = outline.map((point) => ({
    x: (drawn.minX + drawn.maxX) / 2 + (point.x - (model.minX + model.maxX) / 2) * scaleX,
    y: (drawn.minY + drawn.maxY) / 2 + (point.y - (model.minY + model.maxY) / 2) * scaleY
  }))
  return { kind, confidence: 0, points: closePath(rotate(placed, tilt, center)) }
}

// Whether the loop dips into its hull the way only concave outlines do: deep in
// one place (a heart, a moon, a bean), or somewhat deep in many (a cloud, a
// zigzag). A quick loop wobbles in a little here and there, and a loop left open
// often starts or ends with a hook inside, so it may go deep toward its ends,
// unless both ends are deep, like at the top of a heart drawn from its notch.
function dented(loop: Point[]) {
  const hull = convexHull(loop)
  const size = Math.sqrt(polygonArea(hull))
  const depths = loop.map(
    (point) =>
      Math.min(
        ...hull.map((corner, index) =>
          distanceToSegment(point, corner, hull[(index + 1) % hull.length])
        )
      ) / size
  )
  const first = depths[0]
  const last = depths[depths.length - 1]
  const ends = Math.floor(loop.length * 0.12)
  const hook = (depth: number, index: number) =>
    (index < ends && depth <= first) || (index >= loop.length - ends && depth <= last)
  if (depths.some((depth, index) => depth > MAX_DENT && !hook(depth, index))) return true
  if (first > MAX_DENT && last > MAX_DENT) return true
  const dents = depths.filter(
    (depth, index) => depth > SMALL_DENT && !(depths[index - 1] > SMALL_DENT)
  ).length
  return dents >= MAX_SMALL_DENTS
}

// Circle or ellipse with the same center, axes and spread as the hull.
function fitRound(hull: Point[]): Recognition {
  const { center, angle, radii } = areaMoments(hull)
  const round = radii.minor / radii.major > 1 - EQUAL_SIDES
  const rx = round ? Math.sqrt(radii.major * radii.minor) : radii.major
  const ry = round ? rx : radii.minor
  const tilt = foldTilt(angle)
  const outline = Array.from({ length: SAMPLES + 1 }, (_, index) => {
    const t = (index / SAMPLES) * 2 * Math.PI
    return { x: center.x + rx * Math.cos(t), y: center.y + ry * Math.sin(t) }
  })
  return {
    kind: round ? 'circle' : 'ellipse',
    confidence: 0,
    points: rotate(outline, Math.abs(tilt) < SNAP_ANGLE ? angle - tilt : angle, center)
  }
}

// The smallest rectangle around the stroke, pulled in to the stroke's own area so
// overshooting corners don't make it bigger than drawn.
function fitRectangle(box: ReturnType<typeof minAreaRect>, fill: number): Recognition {
  const { center, angle } = box
  let width = box.width * Math.sqrt(fill)
  let height = box.height * Math.sqrt(fill)
  const square = Math.abs(width - height) / Math.max(width, height) < EQUAL_SIDES
  if (square) width = height = (width + height) / 2
  const tilt = foldTilt(angle)
  const corners = rotate(
    [
      { x: center.x - width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y - height / 2 },
      { x: center.x + width / 2, y: center.y + height / 2 },
      { x: center.x - width / 2, y: center.y + height / 2 }
    ],
    angle,
    center
  )
  // A square turned about 45° reads as a diamond.
  if (square && Math.abs(Math.abs(tilt) - Math.PI / 4) < SNAP_ANGLE) return diamond(corners)
  return {
    kind: square ? 'square' : 'rectangle',
    confidence: 0,
    points: closePath(Math.abs(tilt) < SNAP_ANGLE ? rotate(corners, -tilt, center) : corners)
  }
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

function fitTriangle(corners: Point[]): Recognition {
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
  const tilt = Math.abs(tilts[base]) < SNAP_ANGLE ? 0 : tilts[base]
  return { kind: 'triangle', confidence: 0, points: closePath(rotate(vertices, tilt, center)) }
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

function closePath(points: Point[]) {
  return [...points, { ...points[0] }]
}
