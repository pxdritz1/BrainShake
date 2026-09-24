import { describe, expect, it } from 'vitest'
import {
  connectorEndpoints,
  hitTestObject,
  hitTestSegment,
  normalizeBoardShapes,
  normalizeShape,
  resizeShapeFrame,
  resizeStroke
} from './objects'

describe('resizeStroke', () => {
  it('scales the drawn points with the resized frame', () => {
    const stroke = {
      w: 100,
      h: 80,
      points: [
        { x: 0, y: 0 },
        { x: 25, y: 20 },
        { x: 100, y: 80 }
      ]
    }

    expect(resizeStroke(stroke, 200, 160)).toEqual({
      w: 200,
      h: 160,
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 40 },
        { x: 200, y: 160 }
      ]
    })
    expect(stroke.points[1]).toEqual({ x: 25, y: 20 })
  })

  it('does not change the unchanged axis when resizing from an edge', () => {
    expect(resizeStroke({ w: 100, h: 80, points: [{ x: 50, y: 40 }] }, 150, 80)).toEqual({
      w: 150,
      h: 80,
      points: [{ x: 75, y: 40 }]
    })
  })
})

describe('shape geometry', () => {
  it('normalizes a legacy shape to a square without enlarging it or moving its center', () => {
    const shape = { id: 'shape', type: 'shape' as const, x: 10, y: 20, w: 250, h: 180 }
    expect(normalizeShape(shape)).toMatchObject({ x: 45, y: 20, w: 180, h: 180 })
  })

  it('normalizes shapes in a board and leaves other objects alone', () => {
    const image = { id: 'image', type: 'image' as const, x: 0, y: 0, w: 250, h: 180, src: '' }
    const result = normalizeBoardShapes({
      id: 'board',
      name: 'Board',
      objects: [{ id: 'shape', type: 'shape', x: 0, y: 0, w: 250, h: 180 }, image]
    })
    expect(result.objects[0]).toMatchObject({ x: 35, y: 0, w: 180, h: 180 })
    expect(result.objects[1]).toBe(image)
  })

  it('keeps the aspect ratio while resizing from a corner and an edge', () => {
    const corner = resizeShapeFrame({ x: 10, y: 20, w: 200, h: 100 }, 'se', 100, 20, true)
    expect(corner).toEqual({ x: 10, y: 20, w: 300, h: 150 })
    const edge = resizeShapeFrame({ x: 10, y: 20, w: 200, h: 100 }, 'e', 100, 0, true)
    expect(edge).toEqual({ x: 10, y: -5, w: 300, h: 150 })
  })

  it('allows Shift resizing to change the aspect ratio', () => {
    expect(resizeShapeFrame({ x: 0, y: 0, w: 200, h: 100 }, 'se', 100, 50, false)).toEqual({
      x: 0,
      y: 0,
      w: 300,
      h: 150
    })
    expect(resizeShapeFrame({ x: 0, y: 0, w: 200, h: 100 }, 'se', 100, 0, false)).toEqual({
      x: 0,
      y: 0,
      w: 300,
      h: 100
    })
  })
})

describe('hitTestObject', () => {
  it('hits the visible stroke path rather than its full bounding box', () => {
    const stroke = {
      id: 'stroke',
      type: 'stroke',
      x: 10,
      y: 20,
      w: 100,
      h: 100,
      strokeWidth: 4,
      points: [
        { x: 0, y: 0 },
        { x: 100, y: 100 }
      ]
    }
    expect(hitTestObject(stroke, { x: 60, y: 70 })).toBe(true)
    expect(hitTestObject(stroke, { x: 10, y: 120 })).toBe(false)
    expect(hitTestObject(stroke, { x: 60, y: 78 }, 6)).toBe(true)
  })

  it('hits objects by their frame with the given eraser tolerance', () => {
    const note = { id: 'note', type: 'text', x: 20, y: 30, w: 100, h: 80 }
    expect(hitTestObject(note, { x: 125, y: 50 }, 6)).toBe(true)
    expect(hitTestObject(note, { x: 127, y: 50 }, 6)).toBe(false)
  })
})

describe('hitTestSegment', () => {
  it('finds points on or close to connector lines', () => {
    expect(hitTestSegment({ x: 50, y: 50 }, { x: 0, y: 0 }, { x: 100, y: 100 })).toBe(true)
    expect(hitTestSegment({ x: 50, y: 55 }, { x: 0, y: 0 }, { x: 100, y: 100 }, 8)).toBe(true)
    expect(hitTestSegment({ x: 50, y: 62 }, { x: 0, y: 0 }, { x: 100, y: 100 }, 8)).toBe(false)
  })
})

describe('connectorEndpoints', () => {
  it('places each end at the connected object edge', () => {
    const from = { id: 'a', type: 'text', x: 0, y: 0, w: 100, h: 80 }
    const to = { id: 'b', type: 'text', x: 200, y: 0, w: 100, h: 80 }
    expect(connectorEndpoints(from, to)).toEqual({
      start: { x: 100, y: 40 },
      end: { x: 200, y: 40 }
    })
  })
})
