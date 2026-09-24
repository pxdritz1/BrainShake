import { describe, expect, it } from 'vitest'
import type { Point } from '@/features/board/types'
import { bounds, distance, resample, rotate } from './geometry'
import { drawnStrokes } from './drawnStrokes.fixture'
import { recognize, UNATTENDED } from './recognize'

// Deterministic pseudo-random numbers, so a failing case can be reproduced.
function random(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

type Sketch = {
  seed?: number
  wobble?: number
  tilt?: number
  // Fraction of the path to start at, so the stroke doesn't begin on a corner.
  start?: number
  // Fraction of the path drawn past (positive) or short of (negative) the start.
  overshoot?: number
}

// Traces `outline` like a hand would: uneven sampling, a smooth wobble, a tilt,
// and ends that miss each other.
function sketch(outline: Point[], options: Sketch = {}): Point[] {
  const { seed = 1, wobble = 0.02, tilt = 0, start = 0.3, overshoot = 0.04 } = options
  const next = random(seed)
  const path = resample([...outline, outline[0]], 200).slice(0, -1)
  const count = path.length
  const box = bounds(outline)
  const size = Math.max(box.maxX - box.minX, box.maxY - box.minY)
  const points: Point[] = []
  let dx = 0
  let dy = 0
  const total = Math.round(count * (1 + overshoot))
  for (let step = 0; step < total; step += 1 + Math.floor(next() * 3)) {
    dx = dx * 0.8 + (next() - 0.5) * size * wobble
    dy = dy * 0.8 + (next() - 0.5) * size * wobble
    const point = path[(Math.round(start * count) + step) % count]
    points.push({ x: point.x + dx, y: point.y + dy })
  }
  return rotate(points, tilt, { x: 0, y: 0 })
}

const degrees = (value: number) => (value * Math.PI) / 180

const rectangle = (width: number, height: number) => [
  { x: 0, y: 0 },
  { x: width, y: 0 },
  { x: width, y: height },
  { x: 0, y: height }
]

// Regular polygon with its first corner straight up; `radius` can vary per corner.
const polygon = (sides: number, radius: (index: number) => number = () => 100) =>
  Array.from({ length: sides }, (_, index) => {
    const angle = (index / sides) * 2 * Math.PI - Math.PI / 2
    return { x: radius(index) * Math.cos(angle), y: radius(index) * Math.sin(angle) }
  })

const ellipse = (rx: number, ry: number) =>
  Array.from({ length: 90 }, (_, index) => ({
    x: rx * Math.cos((index / 90) * 2 * Math.PI),
    y: ry * Math.sin((index / 90) * 2 * Math.PI)
  }))

function corners(points: Point[]) {
  return points.slice(0, -1)
}

function sides(points: Point[]) {
  const vertices = corners(points)
  return vertices.map((point, index) => distance(point, vertices[(index + 1) % vertices.length]))
}

describe('recognize', () => {
  // Square and rectangle, or circle and ellipse, depend on proportions a hand
  // doesn't control precisely; the family is what must match.
  const family = (kind?: string) =>
    kind === 'square' ? 'rectangle' : kind === 'circle' ? 'ellipse' : kind
  it.each(drawnStrokes)('auto-corrects a real $name', ({ kind, points }) => {
    expect(family(recognize(points, UNATTENDED)?.kind)).toBe(family(kind))
  })

  it('ignores taps and tiny strokes', () => {
    expect(recognize([{ x: 0, y: 0 }])).toBeNull()
    expect(recognize(sketch(rectangle(8, 8)))).toBeNull()
  })

  it('can be made stricter about size and confidence', () => {
    const small = sketch(rectangle(30, 30))
    expect(recognize(small)?.kind).toBe('square')
    expect(recognize(small, { minSize: 60 })).toBeNull()
    const square = sketch(rectangle(200, 200))
    const { confidence } = recognize(square)!
    expect(recognize(square, { minConfidence: confidence + 0.01 })).toBeNull()
  })

  it('leaves freehand scribbles alone', () => {
    const scribble = Array.from({ length: 60 }, (_, index) => ({
      x: index * 5,
      y: Math.sin(index / 3) * 40
    }))
    expect(recognize(scribble)).toBeNull()
  })

  it('leaves shapes it does not idealize alone', () => {
    const trapezoid = [
      { x: 60, y: 0 },
      { x: 240, y: 0 },
      { x: 300, y: 150 },
      { x: 0, y: 150 }
    ]
    // A crescent: the outer arc and back along a smaller inner one.
    const crescent = [
      ...Array.from({ length: 30 }, (_, index) => {
        const angle = Math.PI / 2 + (index / 29) * Math.PI
        return { x: 100 * Math.cos(angle), y: 100 * Math.sin(angle) }
      }),
      ...Array.from({ length: 30 }, (_, index) => {
        const angle = (3 * Math.PI) / 2 - (index / 29) * Math.PI
        return { x: -40 + 70 * Math.cos(angle), y: 100 * Math.sin(angle) }
      })
    ]
    // A heart, started at a random spot.
    const heart = Array.from({ length: 60 }, (_, index) => {
      const t = (index / 60) * 2 * Math.PI
      return {
        x: 96 * Math.sin(t) ** 3,
        y: -6 * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
      }
    })
    // Five round petals, and a loop scalloped all around.
    const flower = Array.from({ length: 150 }, (_, index) => {
      const t = (index / 150) * 2 * Math.PI
      const radius = 50 + 50 * Math.abs(Math.cos(2.5 * t))
      return { x: radius * Math.cos(t), y: radius * Math.sin(t) }
    })
    const zigzag = polygon(16, (index) => (index % 2 ? 70 : 100))
    // A loop gone around three times.
    const coil = Array.from({ length: 150 }, (_, index) => {
      const angle = (index / 50) * 2 * Math.PI
      return { x: (100 + index / 3) * Math.cos(angle), y: (100 + index / 3) * Math.sin(angle) }
    })
    expect(recognize(coil)).toBeNull()
    for (const seed of [1, 2, 3]) {
      expect(recognize(sketch(crescent, { seed })), `crescent ${seed}`).toBeNull()
      expect(recognize(sketch(trapezoid, { seed })), `trapezoid ${seed}`).toBeNull()
      for (const start of [0.1, 0.4, 0.7]) {
        expect(recognize(sketch(heart, { seed, start })), `heart ${seed}`).toBeNull()
        expect(recognize(sketch(flower, { seed, start })), `flower ${seed}`).toBeNull()
        expect(recognize(sketch(zigzag, { seed, start })), `zigzag ${seed}`).toBeNull()
      }
    }
  })

  describe('lines', () => {
    it('straightens a wobbly stroke and snaps it to horizontal', () => {
      const next = random(3)
      const stroke = Array.from({ length: 40 }, (_, index) => ({
        x: index * 5,
        y: index * 0.3 + (next() - 0.5) * 3
      }))
      const result = recognize(stroke)
      expect(result?.kind).toBe('line')
      expect(result?.points).toHaveLength(2)
      expect(result!.points[1].y).toBeCloseTo(result!.points[0].y)
    })

    it('snaps to 45 degrees', () => {
      const stroke = Array.from({ length: 30 }, (_, index) => ({ x: index * 5, y: index * 4.3 }))
      const [start, end] = recognize(stroke)!.points
      expect(end.x - start.x).toBeCloseTo(end.y - start.y)
    })

    it('keeps an angle that is far from any snap', () => {
      const stroke = Array.from({ length: 30 }, (_, index) => ({ x: index * 5, y: index * 2 }))
      const [start, end] = recognize(stroke)!.points
      expect((end.y - start.y) / (end.x - start.x)).toBeCloseTo(0.4, 1)
    })
  })

  describe('arrows', () => {
    // Shaft from the origin to `tip`, then the head as extra legs from the tip.
    function arrow(tip: Point, legs: Point[][], seed = 1) {
      const next = random(seed)
      const path = [{ x: 0, y: 0 }, tip, ...legs.flat()]
      return resample(path, 120).map((point) => ({
        x: point.x + (next() - 0.5) * 3,
        y: point.y + (next() - 0.5) * 3
      }))
    }
    const tip = { x: 240, y: 12 }
    const upper = { x: 205, y: -15 }
    const lower = { x: 208, y: 38 }

    it('cleans up an arrow drawn with a V head', () => {
      for (const seed of [1, 2, 3]) {
        const result = recognize(arrow(tip, [[upper], [tip], [lower]], seed))
        expect(result?.kind, `seed ${seed}`).toBe('arrow')
        const [tail, end, left, again, right] = result!.points
        expect(again).toEqual(end)
        // The shaft snaps level and the barbs mirror each other.
        expect(end.y).toBeCloseTo(tail.y)
        expect(left.x).toBeCloseTo(right.x)
        expect(left.y - end.y).toBeCloseTo(end.y - right.y)
        expect(left.x).toBeLessThan(end.x)
      }
    })

    it('accepts a head with a single barb', () => {
      expect(recognize(arrow(tip, [[lower]]))?.kind).toBe('arrow')
    })

    it('does not mistake a line or a corner for an arrow', () => {
      expect(recognize(arrow(tip, []))?.kind).toBe('line')
      expect(recognize(arrow(tip, [[{ x: 240, y: 160 }]]))).toBeNull()
    })
  })

  describe('rectangles', () => {
    it('turns a crooked square into an even, level square', () => {
      for (const seed of [1, 2, 3, 4, 5]) {
        const result = recognize(sketch(rectangle(200, 186), { seed, tilt: degrees(6) }))
        expect(result?.kind, `seed ${seed}`).toBe('square')
        const vertices = corners(result!.points)
        vertices.forEach((vertex, index) => {
          const next = vertices[(index + 1) % 4]
          expect(Math.min(Math.abs(vertex.x - next.x), Math.abs(vertex.y - next.y))).toBeCloseTo(0)
        })
        const lengths = sides(result!.points)
        for (const length of lengths) expect(length).toBeCloseTo(lengths[0])
      }
    })

    it('keeps a rectangle rectangular', () => {
      const result = recognize(sketch(rectangle(300, 150), { seed: 7 }))
      expect(result?.kind).toBe('rectangle')
      const [top, right] = sides(result!.points)
      expect(top / right).toBeCloseTo(2, 0)
    })

    it('keeps a deliberate tilt', () => {
      const result = recognize(sketch(rectangle(240, 140), { seed: 8, tilt: degrees(25) }))
      expect(result?.kind).toBe('rectangle')
      const [a, b] = corners(result!.points)
      const angle = Math.atan2(b.y - a.y, b.x - a.x)
      expect(Math.abs(Math.abs(angle) % (Math.PI / 2))).toBeGreaterThan(degrees(15))
    })

    it('handles strokes whose ends miss each other', () => {
      for (const [start, overshoot] of [
        [0.3, -0.08], // stops short, leaving the corner undrawn
        [0.1, -0.06], // stops short mid-side
        [0.3, 0.15], // runs well past the start
        [0, 0.05] // starts on a corner
      ])
        expect(
          recognize(sketch(rectangle(200, 200), { seed: 9, start, overshoot }))?.kind,
          `start ${start}, overshoot ${overshoot}`
        ).toBe('square')
    })
  })

  describe('ellipses', () => {
    it('turns a lumpy circle into a round one', () => {
      for (const seed of [1, 2, 3, 4, 5]) {
        const result = recognize(sketch(ellipse(100, 94), { seed }))
        expect(result?.kind, `seed ${seed}`).toBe('circle')
        const box = bounds(result!.points)
        expect(box.maxX - box.minX).toBeCloseTo(box.maxY - box.minY)
      }
    })

    it('keeps an ellipse elongated', () => {
      const result = recognize(sketch(ellipse(150, 70), { seed: 11 }))
      expect(result?.kind).toBe('ellipse')
    })
  })

  describe('triangles', () => {
    it('levels the base and centers the apex', () => {
      const outline = [
        { x: 0, y: 200 },
        { x: 106, y: 0 },
        { x: 200, y: 200 }
      ]
      for (const seed of [1, 2, 3]) {
        const result = recognize(sketch(outline, { seed, tilt: degrees(5) }))
        expect(result?.kind, `seed ${seed}`).toBe('triangle')
        const vertices = corners(result!.points).sort((a, b) => a.y - b.y)
        const [apex, left, right] = vertices
        expect(left.y).toBeCloseTo(right.y)
        expect(apex.x).toBeCloseTo((left.x + right.x) / 2)
      }
    })
  })

  describe('diamonds', () => {
    it('recognizes a rhombus with level diagonals', () => {
      const outline = [
        { x: 100, y: 0 },
        { x: 200, y: 70 },
        { x: 100, y: 140 },
        { x: 0, y: 70 }
      ]
      const result = recognize(sketch(outline, { seed: 4 }))
      expect(result?.kind).toBe('diamond')
      const [top, right, bottom, left] = corners(result!.points)
      expect(top.x).toBeCloseTo(bottom.x)
      expect(left.y).toBeCloseTo(right.y)
    })

    it('reads a square turned 45 degrees as a diamond', () => {
      const result = recognize(sketch(rectangle(150, 150), { seed: 5, tilt: degrees(44) }))
      expect(result?.kind).toBe('diamond')
    })
  })

  describe('pentagons and hexagons', () => {
    it('evens out a pentagon and stands it on its base', () => {
      for (const seed of [1, 2, 3, 4, 5]) {
        const drawn = polygon(5, (index) => 100 + ((index * 7) % 5) * 3)
        const result = recognize(sketch(drawn, { seed, tilt: degrees(6) }))
        expect(result?.kind, `seed ${seed}`).toBe('pentagon')
        const vertices = corners(result!.points)
        expect(vertices).toHaveLength(5)
        const top = vertices.reduce((best, vertex) => (vertex.y < best.y ? vertex : best))
        const box = bounds(vertices)
        expect(top.x).toBeCloseTo((box.minX + box.maxX) / 2)
        const lengths = sides(result!.points)
        for (const length of lengths) expect(length).toBeCloseTo(lengths[0], 0)
      }
    })

    it('recognizes a hexagon with rounded corners, not a circle', () => {
      const hexagon = rotate(polygon(6), Math.PI / 2, { x: 0, y: 0 })
      for (const seed of [1, 2, 3, 4, 5]) {
        const result = recognize(sketch(hexagon, { seed }))
        expect(result?.kind, `seed ${seed}`).toBe('hexagon')
        // Flat top and bottom, like the toolbar's hexagon.
        const vertices = corners(result!.points).sort((a, b) => a.y - b.y)
        expect(vertices[0].y).toBeCloseTo(vertices[1].y)
      }
    })

    it('keeps circles round', () => {
      for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
        const kind = recognize(sketch(ellipse(100, 100), { seed, wobble: 0.03 }))?.kind
        expect(kind, `seed ${seed}`).toBe('circle')
      }
    })
  })

  describe('stars', () => {
    it('recognizes a star drawn as an outline or as a pentagram', () => {
      const outline = polygon(10, (index) => (index % 2 ? 40 : 100))
      const tips = polygon(5)
      const pentagram = [0, 2, 4, 1, 3].map((index) => tips[index])
      for (const seed of [1, 2, 3]) {
        for (const star of [outline, pentagram]) {
          const result = recognize(sketch(star, { seed, tilt: degrees(5) }))
          expect(result?.kind, `seed ${seed}`).toBe('star')
          const points = corners(result!.points)
          expect(points).toHaveLength(10)
          // Upright: the top tip is centered.
          const top = points.reduce((best, point) => (point.y < best.y ? point : best))
          const box = bounds(points)
          expect(top.x).toBeCloseTo((box.minX + box.maxX) / 2)
        }
      }
    })
  })
})
