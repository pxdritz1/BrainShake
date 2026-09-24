import type { Point } from '@/features/board/types'
import { distance, resample, rotate } from './geometry'

// Convex hull (Andrew's monotone chain), counter-clockwise in screen coordinates,
// without repeating the first point.
export function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y)
  if (sorted.length < 3) return sorted
  const cross = (o: Point, a: Point, b: Point) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
  const half = (list: Point[]) => {
    const chain: Point[] = []
    for (const point of list) {
      while (
        chain.length >= 2 &&
        cross(chain[chain.length - 2], chain[chain.length - 1], point) <= 0
      )
        chain.pop()
      chain.push(point)
    }
    chain.pop()
    return chain
  }
  return [...half(sorted), ...half([...sorted].reverse())]
}

// Area of a simple polygon (shoelace), always positive.
export function polygonArea(polygon: Point[]) {
  let sum = 0
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index]
    const b = polygon[(index + 1) % polygon.length]
    sum += a.x * b.y - b.x * a.y
  }
  return Math.abs(sum) / 2
}

export function polygonPerimeter(polygon: Point[]) {
  let sum = 0
  for (let index = 0; index < polygon.length; index++)
    sum += distance(polygon[index], polygon[(index + 1) % polygon.length])
  return sum
}

export type OrientedBox = { center: Point; width: number; height: number; angle: number }

// Smallest rectangle around a convex polygon. One of its sides always lies along
// a hull edge, so trying every edge direction is enough.
export function minAreaRect(hull: Point[]): OrientedBox {
  let best: OrientedBox & { area: number } = {
    center: hull[0],
    width: 0,
    height: 0,
    angle: 0,
    area: Infinity
  }
  for (let index = 0; index < hull.length; index++) {
    const a = hull[index]
    const b = hull[(index + 1) % hull.length]
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    let minU = Infinity
    let maxU = -Infinity
    let minV = Infinity
    let maxV = -Infinity
    for (const point of hull) {
      const u = point.x * cos + point.y * sin
      const v = -point.x * sin + point.y * cos
      minU = Math.min(minU, u)
      maxU = Math.max(maxU, u)
      minV = Math.min(minV, v)
      maxV = Math.max(maxV, v)
    }
    const area = (maxU - minU) * (maxV - minV)
    if (area < best.area) {
      const u = (minU + maxU) / 2
      const v = (minV + maxV) / 2
      best = {
        center: { x: u * cos - v * sin, y: u * sin + v * cos },
        width: maxU - minU,
        height: maxV - minV,
        angle,
        area
      }
    }
  }
  const { center, width, height, angle } = best
  return { center, width, height, angle }
}

// Hull vertices thinned to at most `limit`, keeping them spread around the hull,
// so the largest-inscribed searches below stay cheap.
function thin(hull: Point[], limit: number) {
  if (hull.length <= limit) return hull
  return Array.from(
    { length: limit },
    (_, index) => hull[Math.floor((index * hull.length) / limit)]
  )
}

// Largest polygon with `sides` corners on the hull, in hull order. For each
// first corner, the best fan of triangles from it is built one corner at a time.
export function largestPolygon(hull: Point[], sides: number): Point[] {
  const points = thin(hull, 40)
  const count = points.length
  if (count <= sides) return points
  const triangle = (a: Point, b: Point, c: Point) =>
    Math.abs((b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)) / 2
  let best: Point[] = points.slice(0, sides)
  let bestArea = -1
  for (let first = 0; first < count; first++) {
    const at = (index: number) => points[(first + index) % count]
    // area[used][end]: largest fan from the first corner to `end` with `used` corners.
    const area = Array.from({ length: sides + 1 }, () => new Array<number>(count).fill(-1))
    const from = Array.from({ length: sides + 1 }, () => new Array<number>(count).fill(-1))
    for (let end = 1; end < count; end++) area[2][end] = 0
    for (let used = 3; used <= sides; used++)
      for (let end = used - 1; end < count; end++)
        for (let previous = used - 2; previous < end; previous++) {
          if (area[used - 1][previous] < 0) continue
          const total = area[used - 1][previous] + triangle(at(0), at(previous), at(end))
          if (total > area[used][end]) {
            area[used][end] = total
            from[used][end] = previous
          }
        }
    for (let end = sides - 1; end < count; end++) {
      if (area[sides][end] <= bestArea) continue
      bestArea = area[sides][end]
      const corners = [end]
      for (let used = sides; used > 2; used--) corners.unshift(from[used][corners[0]])
      best = [0, ...corners].map(at)
    }
  }
  return best
}

// Centroid and principal axes of a polygon's area. For an ellipse, the axes are
// its own and `radii` are its semi-axes.
export function areaMoments(polygon: Point[]) {
  let area = 0
  let cx = 0
  let cy = 0
  for (let index = 0; index < polygon.length; index++) {
    const a = polygon[index]
    const b = polygon[(index + 1) % polygon.length]
    const cross = a.x * b.y - b.x * a.y
    area += cross
    cx += (a.x + b.x) * cross
    cy += (a.y + b.y) * cross
  }
  area /= 2
  const center = { x: cx / (6 * area), y: cy / (6 * area) }
  let xx = 0
  let yy = 0
  let xy = 0
  for (let index = 0; index < polygon.length; index++) {
    const a = { x: polygon[index].x - center.x, y: polygon[index].y - center.y }
    const next = polygon[(index + 1) % polygon.length]
    const b = { x: next.x - center.x, y: next.y - center.y }
    const cross = a.x * b.y - b.x * a.y
    xx += (a.y * a.y + a.y * b.y + b.y * b.y) * cross
    yy += (a.x * a.x + a.x * b.x + b.x * b.x) * cross
    xy += (a.x * b.y + 2 * a.x * a.y + 2 * b.x * b.y + b.x * a.y) * cross
  }
  // Second moments about the centroid (Ixx = ∫y², Iyy = ∫x², Ixy = ∫xy).
  const ixx = xx / 12
  const iyy = yy / 12
  const ixy = xy / 24
  const angle = 0.5 * Math.atan2(-2 * ixy, ixx - iyy) + Math.PI / 2
  const spread = Math.sqrt(((ixx - iyy) / 2) ** 2 + ixy ** 2)
  const major = (ixx + iyy) / 2 + spread
  const minor = (ixx + iyy) / 2 - spread
  const size = Math.abs(area)
  // For an ellipse with semi-axes a, b: ∫ along the major axis² = π a³ b / 4.
  return {
    center,
    angle,
    radii: { major: 2 * Math.sqrt(major / size), minor: 2 * Math.sqrt(Math.max(0, minor) / size) }
  }
}

// The polygon stretched so its area moments are round: any ellipse becomes a
// circle, and a stretched polygon keeps its corners.
export function unstretch(polygon: Point[]): Point[] {
  const { center, angle, radii } = areaMoments(polygon)
  return rotate(polygon, -angle, center).map((point) => ({
    x: (point.x - center.x) / radii.major,
    y: (point.y - center.y) / radii.minor
  }))
}

// The sharpest spots of a convex outline, sharpest first: where they are and how
// much the outline turns there, as a share of the full turn. Each spot spans
// `span` of the perimeter, so a rounded corner still counts as one; spots don't
// overlap. A circle turns evenly, about `span` everywhere; a polygon turns almost
// entirely at its corners.
export function cornerTurns(hull: Point[], span = 0.06, count = 7): { share: number; at: Point }[] {
  const ring = resample([...hull, hull[0]], 121).slice(0, -1)
  const size = ring.length
  const heading = ring.map((point, index) => {
    const next = ring[(index + 1) % size]
    return Math.atan2(next.y - point.y, next.x - point.x)
  })
  const turn = heading.map((value, index) => {
    const delta = heading[(index + 1) % size] - value
    return Math.max(0, Math.atan2(Math.sin(delta), Math.cos(delta)))
  })
  const total = turn.reduce((sum, value) => sum + value, 0)
  const width = Math.max(1, Math.round(size * span))
  const at = (index: number) => ((index % size) + size) % size
  const windows = turn.map((_, start) => {
    let sum = 0
    for (let offset = 0; offset < width; offset++) sum += turn[at(start + offset)]
    return sum
  })
  const taken = new Array<boolean>(size).fill(false)
  const turns: { share: number; at: Point }[] = []
  while (turns.length < count) {
    let best = -1
    for (let start = 0; start < size; start++) {
      let free = true
      for (let offset = 0; offset < width && free; offset++) free = !taken[at(start + offset)]
      if (free && (best < 0 || windows[start] > windows[best])) best = start
    }
    if (best < 0) break
    turns.push({
      share: total ? windows[best] / total : 0,
      at: ring[at(best + Math.floor(width / 2))]
    })
    // Keep a gap of half a spot on each side, so one corner isn't counted twice.
    const pad = Math.floor(width / 2)
    for (let offset = -pad; offset < width + pad; offset++) taken[at(best + offset)] = true
  }
  while (turns.length < count) turns.push({ share: 0, at: ring[0] })
  return turns
}
