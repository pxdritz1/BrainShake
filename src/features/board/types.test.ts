import assert from 'node:assert/strict'
import test from 'node:test'
import { isBoard, isBoardData, isBoardItem } from './types.ts'

test('accepts saved boards and old exports without an id', () => {
  const objects = [
    { id: 'note', type: 'sticky', x: 1, y: 2, w: 3, h: 4, text: 'hello' },
    { id: 'link', type: 'connector', from: 'note', to: 'note' }
  ]
  assert.equal(isBoard({ id: 'board', name: 'Board', objects }), true)
  assert.equal(isBoardData({ name: 'Board', objects }), true)
  assert.equal(isBoard({ name: 'Board', objects }), false)
})

test('keeps unknown positioned objects and rejects malformed input', () => {
  assert.equal(isBoardItem({ id: 'new', type: 'future', x: 0, y: 0, w: 1, h: 1 }), true)
  assert.equal(isBoardItem({ id: 'bad', type: 'sticky', x: 'wrong', y: 0, w: 1, h: 1 }), false)
  assert.equal(isBoardData({ name: 'Board', objects: [{}] }), false)
})

test('accepts strokes snapped to a shape', () => {
  const stroke = { id: 's', type: 'stroke', x: 0, y: 0, w: 10, h: 10, points: [] }
  assert.equal(isBoardItem({ ...stroke, recognizedShape: 'square' }), true)
  assert.equal(isBoardItem({ ...stroke, recognizedShape: 4 }), false)
})

test('accepts saved eraser marks and rejects malformed marks', () => {
  const stroke = { id: 's', type: 'stroke', x: 0, y: 0, w: 10, h: 10, points: [] }
  assert.equal(isBoardItem({ ...stroke, erasures: [{ points: [{ x: 1, y: 2 }], width: 8 }] }), true)
  assert.equal(
    isBoardItem({ ...stroke, erasures: [{ points: [{ x: 1, y: 2 }], width: 'wide' }] }),
    false
  )
})
