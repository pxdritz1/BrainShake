import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import { Toast } from '@/components/Toast'
import { useToast } from '@/hooks/useToast'
import { Sidebar } from '@/layout/Sidebar'
import { Topbar } from '@/layout/Topbar'
import { useBoardEditor } from '@/features/board/hooks/useBoardEditor'
import { Canvas } from '@/features/canvas/components/Canvas'
import { ZoomControls } from '@/features/canvas/components/ZoomControls'
import { useCanvasPointer } from '@/features/canvas/hooks/useCanvasPointer'
import { useKeyboardShortcuts } from '@/features/canvas/hooks/useKeyboardShortcuts'
import { useViewport } from '@/features/canvas/hooks/useViewport'
import { ImageUrlDialog } from '@/features/import-export/components/ImageUrlDialog'
import { useImportExport } from '@/features/import-export/hooks/useImportExport'
import { usePreferences } from '@/features/preferences/usePreferences'
import { PropertiesPanel } from '@/features/properties/PropertiesPanel'
import { Toolbar } from '@/features/toolbar/Toolbar'
import { getFontScale, normalizeFontSize } from '@/features/accessibility/accessibility'
import { AccessibilityTour } from '@/features/accessibility/AccessibilityTour'
import { PresentationMode } from '@/features/presentation/PresentationMode'
import { useSnapshots } from '@/features/workspace/useSnapshots'

export default function App() {
  const [toast, showToast] = useToast()
  const preferences = usePreferences()
  const viewport = useViewport()
  const editor = useBoardEditor({ viewport, showToast })
  const pointer = useCanvasPointer({
    editor,
    viewport,
    autoSnap: preferences.autoSnapShapes,
    onSnap: ({ kind }, linked) =>
      showToast(
        linked
          ? 'Linked with an arrow. Undo to keep your drawing.'
          : `Snapped to ${kind}. Undo to keep your drawing.`
      ),
    onGesture: ({ type, ids }) => {
      const one = ids.length === 1
      const items = one ? '1 item' : `${ids.length} items`
      showToast(
        type === 'erase'
          ? `Erased ${items}. Undo to bring ${one ? 'it' : 'them'} back.`
          : `Selected ${items}.`
      )
    }
  })
  const snapshots = useSnapshots({ editor, showToast })
  const transfer = useImportExport({ editor, snapshots, showToast })
  const { board, selected } = editor
  const selectionKey = selected.join('|')
  const [panelState, setPanelState] = useState<{ selectionKey: string; hidden: boolean } | null>(
    null
  )
  const showPanel =
    selected.length > 0 && !(panelState?.selectionKey === selectionKey && panelState.hidden)
  const closePanel = useCallback(
    () => setPanelState({ selectionKey, hidden: true }),
    [selectionKey]
  )
  const togglePanel = () => setPanelState({ selectionKey, hidden: showPanel })
  const [tourOpen, setTourOpen] = useState(false)
  const [presentationOpen, setPresentationOpen] = useState(false)
  const [presentationItemId, setPresentationItemId] = useState<string | null>(null)

  useEffect(() => {
    const mobileQuery = window.matchMedia('(max-width: 720px)')
    const closePanelOnMobile = (event: MediaQueryListEvent) => {
      if (event.matches) closePanel()
    }
    mobileQuery.addEventListener('change', closePanelOnMobile)
    return () => mobileQuery.removeEventListener('change', closePanelOnMobile)
  }, [closePanel])

  const fileRef = useRef<HTMLInputElement>(null)
  const boardFileRef = useRef<HTMLInputElement>(null)
  const openFilePicker = () => fileRef.current?.click()
  const toggleSlides = () => {
    const selectedItems = board.objects.filter((item) => selected.includes(item.id))
    if (!selectedItems.length) return
    const shouldAdd = selectedItems.some((item) => !('slide' in item) || !item.slide)
    const highestOrder = board.objects.reduce(
      (highest, item) =>
        Math.max(
          highest,
          'slideOrder' in item && typeof item.slideOrder === 'number' ? item.slideOrder : 0
        ),
      0
    )
    selectedItems.forEach((item, index) =>
      editor.updateObject(
        item.id,
        shouldAdd
          ? { slide: true, slideOrder: highestOrder + index + 1 }
          : { slide: false, slideOrder: undefined },
        false
      )
    )
  }

  async function screenshotWorkspace() {
    const canvas = viewport.canvasRef.current
    if (!canvas) return
    try {
      const dataUrl = await toPng(canvas, { cacheBust: true, pixelRatio: 2 })
      const link = document.createElement('a')
      link.download = `${editor.board.name || 'brainshake-workspace'}.png`
      link.href = dataUrl
      link.click()
      showToast('Workspace screenshot downloaded')
    } catch {
      showToast('Could not capture workspace')
    }
  }

  useKeyboardShortcuts({
    undo: editor.undo,
    redo: editor.redo,
    selectAll: editor.selectAll,
    copy: editor.copySelection,
    paste: transfer.pasteClipboard,
    remove: editor.removeSelection,
    cancel: () => {
      editor.setSelected([])
      editor.setTool('select')
    },
    setTool: editor.setTool,
    enabled: preferences.keyboardNavigation
  })

  const fontScale = getFontScale(preferences.fontSize)
  return (
    <>
      <div
        className={`app theme-${preferences.theme} font-size-${normalizeFontSize(preferences.fontSize)} ${preferences.highContrast ? 'accessibility-high-contrast' : ''} ${preferences.reduceMotion ? 'reduce-motion' : ''} ${preferences.enhancedFocus ? 'enhanced-focus' : ''} ${preferences.sidebarAutoHide ? 'sidebar-auto-hide' : ''}`}
        style={
          {
            '--primary': preferences.accent,
            '--stroke-color': preferences.accent,
            '--font-scale': fontScale,
            '--header-custom': preferences.headerColor || 'var(--paper)',
            '--sidebar-custom': preferences.sidebarColor || 'var(--paper)',
            '--canvas-custom': preferences.canvasColor || 'var(--surface)',
            '--panel-custom': preferences.panelColor || 'var(--paper)',
            '--focus-color': preferences.focusColor
          } as React.CSSProperties
        }
      >
        {transfer.importing && (
          <div className="workspace-importing" role="status" aria-live="polite">
            Importing workspace…
          </div>
        )}
        <Topbar
          editor={editor}
          transfer={transfer}
          onImportBoard={() => boardFileRef.current?.click()}
          onToggleSettings={togglePanel}
          onOpenTour={() => setTourOpen(true)}
          onOpenPresentation={() => setPresentationOpen(true)}
        />
        <Sidebar
          editor={editor}
          transfer={transfer}
          snapshots={snapshots}
          onImportFiles={openFilePicker}
          autoHide={preferences.sidebarAutoHide}
          preferences={preferences}
          onOpenTour={() => setTourOpen(true)}
        />
        <main className="workspace">
          <Canvas
            editor={editor}
            viewport={viewport}
            pointer={pointer}
            grid={preferences.grid}
            onImportFiles={transfer.importFiles}
            onScreenshot={screenshotWorkspace}
            presenting={presentationOpen}
            presentingItemId={presentationItemId}
          />
          <Toolbar
            editor={editor}
            dockPosition={preferences.dockPosition}
            onDockChange={preferences.setDockPosition}
            onToggleSlides={toggleSlides}
            keyboardNavigation={preferences.keyboardNavigation}
          />
          <ZoomControls
            zoom={viewport.zoom}
            onZoomIn={viewport.zoomIn}
            onZoomOut={viewport.zoomOut}
            onFit={() => viewport.fitContent(board.objects.length > 0)}
          />
          {showPanel && (
            <PropertiesPanel
              item={board.objects.find((item) => item.id === selected[0])}
              onChange={editor.updateObject}
              onClose={closePanel}
            />
          )}
          {transfer.urlOpen && (
            <ImageUrlDialog onClose={transfer.closeUrlDialog} onSubmit={transfer.submitImageUrl} />
          )}
          {toast && <Toast message={toast} />}
          <input
            ref={fileRef}
            type="file"
            hidden
            multiple
            accept="image/*,video/*,.html,.md,.txt"
            onChange={(event) => {
              transfer.importFiles(event.target.files)
              event.target.value = ''
            }}
          />
          <input
            ref={boardFileRef}
            type="file"
            hidden
            accept="application/json,application/zip,.json,.brainshake,.brainshake.json"
            onChange={(event) => {
              if (event.target.files?.[0]) transfer.importBoardFile(event.target.files[0])
              event.target.value = ''
            }}
          />
        </main>
        <AccessibilityTour
          isOpen={tourOpen}
          preferences={preferences}
          onClose={() => setTourOpen(false)}
        />
        {presentationOpen && (
          <PresentationMode
            items={board.objects}
            viewport={viewport}
            onActiveItemChange={setPresentationItemId}
            onClose={() => {
              setPresentationOpen(false)
              setPresentationItemId(null)
            }}
          />
        )}
      </div>
    </>
  )
}
