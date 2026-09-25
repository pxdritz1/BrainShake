import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'
import type { CanvasItem } from '@/features/board/types'
import { CanvasObject } from './CanvasObject'

vi.mock('./StickyObject', () => ({ StickyObject: () => null }))

const stroke: CanvasItem = {
  id: 'stroke-1',
  type: 'stroke',
  x: 0,
  y: 0,
  w: 100,
  h: 80,
  points: [
    { x: 0, y: 0 },
    { x: 100, y: 80 }
  ]
}

function renderObject(activeTool: string, item = stroke) {
  return renderToStaticMarkup(
    createElement(CanvasObject, {
      item,
      selected: true,
      activeTool,
      presentingActive: false,
      onSelect: vi.fn(),
      onDrag: vi.fn(),
      onResize: vi.fn(),
      onChange: vi.fn(),
      onRemove: vi.fn()
    })
  )
}

describe('CanvasObject resize handles', () => {
  it('shows all resize handles for a selected object in select mode', () => {
    const markup = renderObject('select')
    expect(markup.match(/resize-handle resize-/g)).toHaveLength(8)
    expect([...markup.matchAll(/data-direction="([^"]+)"/g)].map((match) => match[1])).toEqual([
      'nw',
      'n',
      'ne',
      'e',
      'se',
      's',
      'sw',
      'w'
    ])
  })

  it('hides resize handles and selection framing while drawing with the pen', () => {
    const markup = renderObject('pen')
    expect(markup).not.toContain('resize-handle')
    expect(markup).not.toContain(' selected')
  })

  it('does not render resize handles for a locked object', () => {
    expect(renderObject('select', { ...stroke, locked: true })).not.toContain('resize-handle')
  })
})

describe('CanvasObject eraser behavior', () => {
  it('renders saved erasure marks as an SVG mask', () => {
    const markup = renderObject('select', {
      ...stroke,
      erasures: [
        {
          points: [
            { x: 10, y: 12 },
            { x: 20, y: 24 }
          ],
          width: 28
        }
      ]
    })
    expect(markup).toContain('eraser-mask-defs')
    expect(markup).toContain('mask:url(#erasures-')
    expect(markup).toContain('stroke-width="28"')
  })

  it('hides the title bar and close button on notes and images', () => {
    const note = renderObject('select', { ...stroke, type: 'sticky' })
    const image = renderObject('select', { ...stroke, type: 'image', src: 'image.png' })
    expect(note).not.toContain('widget-titlebar')
    expect(note).not.toContain('Close widget')
    expect(image).not.toContain('widget-titlebar')
    expect(image).not.toContain('Close widget')
  })
})
