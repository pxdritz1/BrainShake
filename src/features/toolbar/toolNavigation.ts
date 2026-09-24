export const TOOL_SEQUENCE = [
  'select',
  'hand',
  'text',
  'sticky',
  'pen',
  'eraser',
  'connector'
] as const

type ToolId = (typeof TOOL_SEQUENCE)[number]
type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export function getNextToolFromArrow(
  currentTool: string,
  key: string,
  dockPosition: string,
  enabled: boolean
): ToolId | null {
  if (!enabled) return null

  const horizontalDock = dockPosition === 'top' || dockPosition === 'bottom'
  const forward: ArrowKey = horizontalDock ? 'ArrowRight' : 'ArrowDown'
  const backward: ArrowKey = horizontalDock ? 'ArrowLeft' : 'ArrowUp'
  if (key !== forward && key !== backward) return null

  const currentIndex = TOOL_SEQUENCE.indexOf(currentTool as ToolId)
  if (currentIndex < 0) return null

  const step = key === forward ? 1 : -1
  const nextIndex = (currentIndex + step + TOOL_SEQUENCE.length) % TOOL_SEQUENCE.length
  return TOOL_SEQUENCE[nextIndex]
}

export function shouldPanWithSpace({
  spacePressed,
  button,
  interactiveTarget
}: {
  spacePressed: boolean
  button: number
  interactiveTarget: boolean
}) {
  return spacePressed && button === 0 && !interactiveTarget
}

export function canBeginCanvasPan({
  tool,
  pointerType,
  isPrimary,
  spacePressed,
  button
}: {
  tool: string
  pointerType: string
  isPrimary: boolean
  spacePressed: boolean
  button: number
}) {
  if (button === 1) return pointerType === 'mouse'
  if (button !== 0 || (pointerType === 'touch' && !isPrimary)) return false
  return tool === 'hand' || spacePressed || (tool === 'select' && pointerType === 'touch')
}
