import { HtmlObject } from './HtmlObject'
import { ImageObject } from './ImageObject'
import { ShapeObject } from './ShapeObject'
import { StickyObject } from './StickyObject'
import { StrokeObject } from './StrokeObject'
import { TextObject } from './TextObject'
import { VideoObject } from './VideoObject'
import type { ComponentType } from 'react'
import type { BoardPatch, CanvasItem } from '@/features/board/types'

// type -> how the object is rendered on the canvas.
// framed: wrapped in WidgetFrame (titlebar + close). className: extra class on the unframed root.
// defaultSize: size used when the object is created without an explicit w/h.
type ObjectConfig = {
  Component: ComponentType<{
    item: CanvasItem
    onChange: (id: string, patch: BoardPatch, saveHistory?: boolean) => void
    selected?: boolean
  }> | null
  framed: boolean
  className?: string
  defaultSize?: { w: number; h: number }
}

export const objectRegistry: Record<string, ObjectConfig> = {
  sticky: { Component: StickyObject, framed: true, defaultSize: { w: 250, h: 180 } },
  text: {
    Component: TextObject,
    framed: false,
    className: 'text-object',
    defaultSize: { w: 280, h: 145 }
  },
  image: { Component: ImageObject, framed: true, defaultSize: { w: 280, h: 200 } },
  video: { Component: VideoObject, framed: true, defaultSize: { w: 320, h: 220 } },
  html: { Component: HtmlObject, framed: true, defaultSize: { w: 350, h: 240 } },
  shape: {
    Component: ShapeObject,
    framed: false,
    className: 'shape-object',
    defaultSize: { w: 180, h: 180 }
  },
  stroke: { Component: StrokeObject, framed: false, className: 'stroke-object' }
}

// Unknown types (e.g. from an imported file) render as an empty frame.
const fallback: ObjectConfig = { Component: null, framed: true }

export function getObjectType(type: string) {
  return objectRegistry[type] || fallback
}

export function defaultSize(type: string) {
  return getObjectType(type).defaultSize || { w: 250, h: 180 }
}
