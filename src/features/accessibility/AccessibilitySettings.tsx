import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { usePreferences } from '@/features/preferences/usePreferences'
<<<<<<< HEAD
=======
import { Minus, Plus, RotateCcw } from '@/components/icons/PaperIcons'
>>>>>>> 4e211e1 (refactor(icons): substitui Lucide por ícones próprios)
import { FONT_SIZES, normalizeFontSize } from './accessibility'

const fontLabels = {
  small: 'Small',
  default: 'Default',
  large: 'Large',
  'extra-large': 'Extra large'
} as const

export function AccessibilitySettings({
  preferences,
  onOpenTour
}: {
  preferences: ReturnType<typeof usePreferences>
  onOpenTour: () => void
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const fontSize = normalizeFontSize(preferences.fontSize)
  const fontIndex = FONT_SIZES.indexOf(fontSize)
  const setFontAt = (index: number) => preferences.setFontSize(FONT_SIZES[index])

  return (
    <section
      className="customize-section accessibility-settings"
      aria-labelledby="accessibility-heading"
    >
      <div className="customize-section-heading">
        <h2 id="accessibility-heading" className="customize-section-title">
          Accessibility
        </h2>
        <Button variant="ghost" className="text-button" onClick={onOpenTour}>
          Tour
        </Button>
      </div>
      <div className="customize-row accessibility-font-row">
        <span>Text size</span>
        <div
          className="font-size-control"
          role="group"
          aria-label={`Text size: ${fontLabels[fontSize]}`}
        >
          <Button
            variant="ghost"
            className="font-size-step"
            title="Decrease text size"
            aria-label="Decrease text size"
            disabled={fontIndex === 0}
            onClick={() => setFontAt(fontIndex - 1)}
          >
            A−
          </Button>
          <span aria-live="polite">{fontLabels[fontSize]}</span>
          <Button
            variant="ghost"
            className="font-size-step"
            title="Increase text size"
            aria-label="Increase text size"
            disabled={fontIndex === FONT_SIZES.length - 1}
            onClick={() => setFontAt(fontIndex + 1)}
          >
            A+
          </Button>
        </div>
      </div>
      <ToggleRow
        label="High contrast"
        value={preferences.highContrast}
        onChange={() => preferences.setHighContrast((value) => !value)}
      />
      <ToggleRow
        label="Reduce motion"
        value={preferences.reduceMotion}
        onChange={() => preferences.setReduceMotion((value) => !value)}
      />
      <Button
        variant="ghost"
        className="advanced-accessibility-trigger"
        aria-expanded={advancedOpen}
        onClick={() => setAdvancedOpen((current) => !current)}
      >
        More accessibility options
        <span aria-hidden="true" className={`disclosure-chevron ${advancedOpen ? 'open' : ''}`} />
      </Button>
      {advancedOpen && (
        <div className="advanced-accessibility-content">
          <ToggleRow
            label="Keyboard navigation"
            description="Enable shortcuts and tool switching."
            value={preferences.keyboardNavigation}
            onChange={() => preferences.setKeyboardNavigation((value) => !value)}
          />
          <ToggleRow
            label="Enhanced focus"
            description="Make keyboard focus easier to see."
            value={preferences.enhancedFocus}
            onChange={() => preferences.setEnhancedFocus((value) => !value)}
          />
          <label className="customize-row">
            <span>Focus color</span>
            <input
              className="focus-color-picker"
              type="color"
              value={preferences.focusColor}
              aria-label="Focus color"
              onChange={(event) => preferences.setFocusColor(event.target.value)}
            />
          </label>
        </div>
      )}
    </section>
  )
}

export function ToggleRow({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description?: string
  value: boolean
  onChange: () => void
}) {
  return (
    <div className="customize-row toggle-row">
      <span className="toggle-row-copy">
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <Button
        variant="ghost"
        className={`switch-control ${value ? 'on' : ''}`}
        aria-label={label}
        aria-pressed={value}
        onClick={onChange}
      >
        <span />
      </Button>
    </div>
  )
}
