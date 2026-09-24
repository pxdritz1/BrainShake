import { describe, expect, it } from 'vitest'
import { canBeginCanvasPan, getNextToolFromArrow, shouldPanWithSpace } from './toolNavigation'

describe('getNextToolFromArrow', () => {
  it('cycles through the tool sequence with the horizontal dock axis', () => {
    expect(getNextToolFromArrow('select', 'ArrowRight', 'top', true)).toBe('hand')
    expect(getNextToolFromArrow('connector', 'ArrowRight', 'bottom', true)).toBe('select')
    expect(getNextToolFromArrow('select', 'ArrowLeft', 'bottom', true)).toBe('connector')
  })

  it('uses the vertical dock axis for side docks', () => {
    expect(getNextToolFromArrow('hand', 'ArrowDown', 'right', true)).toBe('text')
    expect(getNextToolFromArrow('pen', 'ArrowDown', 'right', true)).toBe('eraser')
    expect(getNextToolFromArrow('select', 'ArrowUp', 'left', true)).toBe('connector')
    expect(getNextToolFromArrow('select', 'ArrowRight', 'left', true)).toBeNull()
  })

  it('ignores arrows when disabled or when the active tool is not in the sequence', () => {
    expect(getNextToolFromArrow('select', 'ArrowRight', 'top', false)).toBeNull()
    expect(getNextToolFromArrow('shape', 'ArrowRight', 'top', true)).toBeNull()
    expect(getNextToolFromArrow('select', 'Enter', 'top', true)).toBeNull()
  })
})

describe('shouldPanWithSpace', () => {
  it('starts a pan only for a primary-button drag outside interactive controls', () => {
    expect(shouldPanWithSpace({ spacePressed: true, button: 0, interactiveTarget: false })).toBe(
      true
    )
    expect(shouldPanWithSpace({ spacePressed: false, button: 0, interactiveTarget: false })).toBe(
      false
    )
    expect(shouldPanWithSpace({ spacePressed: true, button: 2, interactiveTarget: false })).toBe(
      false
    )
    expect(shouldPanWithSpace({ spacePressed: true, button: 0, interactiveTarget: true })).toBe(
      false
    )
  })
})

describe('canBeginCanvasPan', () => {
  it('keeps touch panning for the selected tool and ignores non-primary touches', () => {
    expect(
      canBeginCanvasPan({
        tool: 'select',
        pointerType: 'touch',
        isPrimary: true,
        spacePressed: false,
        button: 0
      })
    ).toBe(true)
    expect(
      canBeginCanvasPan({
        tool: 'select',
        pointerType: 'touch',
        isPrimary: false,
        spacePressed: false,
        button: 0
      })
    ).toBe(false)
  })

  it('allows space-drag from other tools while retaining hand-tool panning', () => {
    expect(
      canBeginCanvasPan({
        tool: 'sticky',
        pointerType: 'mouse',
        isPrimary: true,
        spacePressed: true,
        button: 0
      })
    ).toBe(true)
    expect(
      canBeginCanvasPan({
        tool: 'hand',
        pointerType: 'mouse',
        isPrimary: true,
        spacePressed: false,
        button: 0
      })
    ).toBe(true)
  })
})
