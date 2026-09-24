import { useEffect, useState } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { STORAGE_KEYS } from '@/features/board/lib/storage'
import { loadDockPosition } from './dockPosition'

export function usePreferences() {
  const [theme, setTheme] = useLocalStorage(STORAGE_KEYS.theme, 'light')
  const [accent, setAccent] = useLocalStorage(STORAGE_KEYS.accent, '#0a84ff')
  const [dockPosition, setDockPosition] = useState(() => loadDockPosition(localStorage))
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.dock, JSON.stringify(dockPosition))
  }, [dockPosition])
  const [fontSize, setFontSize] = useLocalStorage(STORAGE_KEYS.fontSize, 'default')
  const [highContrast, setHighContrast] = useLocalStorage(STORAGE_KEYS.highContrast, false)
  const [reduceMotion, setReduceMotion] = useLocalStorage(STORAGE_KEYS.reduceMotion, false)
  const [keyboardNavigation, setKeyboardNavigation] = useLocalStorage(
    STORAGE_KEYS.keyboardNavigation,
    true
  )
  const [enhancedFocus, setEnhancedFocus] = useLocalStorage(STORAGE_KEYS.enhancedFocus, true)
  const [focusColor, setFocusColor] = useLocalStorage(STORAGE_KEYS.focusColor, '#0a84ff')
  const [tutorialCompleted, setTutorialCompleted] = useLocalStorage(
    STORAGE_KEYS.tutorialCompleted,
    false
  )
  const [sidebarAutoHide, setSidebarAutoHide] = useLocalStorage(STORAGE_KEYS.sidebarAutoHide, false)
  const [headerColor, setHeaderColor] = useLocalStorage(STORAGE_KEYS.headerColor, '')
  const [sidebarColor, setSidebarColor] = useLocalStorage(STORAGE_KEYS.sidebarColor, '')
  const [canvasColor, setCanvasColor] = useLocalStorage(STORAGE_KEYS.canvasColor, '')
  const [panelColor, setPanelColor] = useLocalStorage(STORAGE_KEYS.panelColor, '')
  const [autoSnapShapes, setAutoSnapShapes] = useLocalStorage(STORAGE_KEYS.autoSnapShapes, false)
  const [grid, setGrid] = useState(true)
  return {
    theme,
    setTheme,
    accent,
    setAccent,
    dockPosition,
    setDockPosition,
    fontSize,
    setFontSize,
    highContrast,
    setHighContrast,
    reduceMotion,
    setReduceMotion,
    keyboardNavigation,
    setKeyboardNavigation,
    enhancedFocus,
    setEnhancedFocus,
    focusColor,
    setFocusColor,
    tutorialCompleted,
    setTutorialCompleted,
    sidebarAutoHide,
    setSidebarAutoHide,
    headerColor,
    setHeaderColor,
    sidebarColor,
    setSidebarColor,
    canvasColor,
    setCanvasColor,
    panelColor,
    setPanelColor,
    autoSnapShapes,
    setAutoSnapShapes,
    grid,
    setGrid
  }
}
