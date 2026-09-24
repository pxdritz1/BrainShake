import { describe, expect, it } from 'vitest'
import { clipboardTextSize } from './files'

describe('clipboardTextSize', () => {
  it('keeps readable minimum dimensions for short clipboard text', () => {
    expect(clipboardTextSize('A short note')).toEqual({ w: 240, h: 120 })
  })

  it('sizes multiline and long text within the supported limits', () => {
    expect(clipboardTextSize('x'.repeat(200))).toMatchObject({ w: 480, h: 172 })
    expect(
      clipboardTextSize(Array.from({ length: 40 }, () => 'long line '.repeat(20)).join('\n'))
    ).toMatchObject({ w: 480, h: 480 })
  })
})
