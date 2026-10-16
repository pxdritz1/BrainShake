import { Button } from '@/components/ui/button'
import type { BoardItem, CanvasItem } from '@/features/board/types'
import { isCanvasItem, isConnectorItem } from '@/features/board/types'
import type { useViewport } from '@/features/canvas/hooks/useViewport'
import { MAX_ZOOM, MIN_ZOOM } from '@/features/canvas/hooks/useViewport'
import { ChevronLeft, ChevronRight, X } from '@/components/icons/PaperIcons'
import { useEffect, useRef, useState } from 'react'

function computeTargetViewport(
  item: CanvasItem,
  container: { w: number; h: number },
  padding = 80
) {
  const zoom = Math.min((container.w - padding * 2) / item.w, (container.h - padding * 2) / item.h)
  const targetZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
  return {
    zoom: targetZoom,
    pan: {
      x: container.w / 2 - (item.x + item.w / 2) * targetZoom,
      y: container.h / 2 - (item.y + item.h / 2) * targetZoom
    }
  }
}

export function PresentationMode({
  items,
  viewport,
  onActiveItemChange,
  onClose
}: {
  items: BoardItem[]
  viewport: ReturnType<typeof useViewport>
  onActiveItemChange: (id: string | null) => void
  onClose: () => void
}) {
  const slides = orderSlides(items)
  const [index, setIndex] = useState(0)
  const current = slides[index]
  const currentId = current?.id
  const currentX = current?.x
  const currentY = current?.y
  const currentWidth = current?.w
  const currentHeight = current?.h
  const initialViewport = useRef({ zoom: viewport.zoom, pan: viewport.pan })
  const { canvasRef, setPan: setViewportPan, setZoom: setViewportZoom } = viewport

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === ' ')
        setIndex((value) => Math.min(value + 1, slides.length - 1))
      if (event.key === 'ArrowLeft') setIndex((value) => Math.max(value - 1, 0))
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose, slides.length])

  useEffect(() => {
    const savedViewport = initialViewport.current
    return () => {
      setViewportZoom(savedViewport.zoom)
      setViewportPan(savedViewport.pan)
    }
  }, [setViewportPan, setViewportZoom])

  useEffect(() => {
    onActiveItemChange(currentId ?? null)
    if (!currentId || currentX === undefined || currentY === undefined) return
    if (currentWidth === undefined || currentHeight === undefined) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const target = computeTargetViewport(
      {
        id: currentId,
        type: 'presentation',
        x: currentX,
        y: currentY,
        w: currentWidth,
        h: currentHeight
      },
      { w: rect.width, h: rect.height }
    )
    setViewportZoom(target.zoom)
    setViewportPan(target.pan)
  }, [
    canvasRef,
    currentHeight,
    currentId,
    currentWidth,
    currentX,
    currentY,
    index,
    onActiveItemChange,
    setViewportPan,
    setViewportZoom
  ])

  return (
    <header className="presentation-toolbar" aria-label="Presentation controls">
      <strong>
        Presentation · {slides.length ? `${index + 1} / ${slides.length}` : 'No slides'}
      </strong>
      <div className="presentation-actions">
        <Button
          variant="ghost"
          className="icon-button"
          disabled={index === 0}
          title="Previous slide"
          aria-label="Previous slide"
          onClick={() => setIndex((value) => Math.max(value - 1, 0))}
        >
          <ChevronLeft size={20} />
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          disabled={!current || index === slides.length - 1}
          title="Next slide"
          aria-label="Next slide"
          onClick={() => setIndex((value) => Math.min(value + 1, slides.length - 1))}
        >
          <ChevronRight size={20} />
        </Button>
        <Button
          variant="ghost"
          className="icon-button"
          title="Close presentation"
          aria-label="Close presentation"
          onClick={onClose}
        >
          <X size={17} />
        </Button>
      </div>
    </header>
  )
}

function orderSlides(items: BoardItem[]) {
  const slides = items
    .filter((item): item is CanvasItem => isCanvasItem(item) && !!item.slide)
    .sort(byClickOrder)
  const slideIds = new Set(slides.map((slide) => slide.id))
  const outgoing = new Map<string, string[]>()
  const indegree = new Map(slides.map((slide) => [slide.id, 0]))

  items.filter(isConnectorItem).forEach((connector) => {
    if (!slideIds.has(connector.from) || !slideIds.has(connector.to)) return
    outgoing.set(connector.from, [...(outgoing.get(connector.from) || []), connector.to])
    indegree.set(connector.to, (indegree.get(connector.to) || 0) + 1)
  })

  const queue = slides.filter((slide) => indegree.get(slide.id) === 0)
  const ordered: CanvasItem[] = []
  while (queue.length) {
    const current = queue.shift()!
    ordered.push(current)
    for (const targetId of outgoing.get(current.id) || []) {
      const remaining = (indegree.get(targetId) || 0) - 1
      indegree.set(targetId, remaining)
      if (remaining === 0) {
        const target = slides.find((slide) => slide.id === targetId)
        if (target) {
          queue.push(target)
          queue.sort(byClickOrder)
        }
      }
    }
  }
  return ordered.length === slides.length
    ? ordered
    : [...ordered, ...slides.filter((slide) => !ordered.includes(slide))]
}

function byClickOrder(left: CanvasItem, right: CanvasItem) {
  return (
    (left.slideOrder ?? Number.MAX_SAFE_INTEGER) - (right.slideOrder ?? Number.MAX_SAFE_INTEGER)
  )
}
