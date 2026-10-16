import { Button } from '@/components/ui/button'
import type { usePreferences } from '@/features/preferences/usePreferences'
import { Minus, Plus, RotateCcw } from '@/components/icons/PaperIcons'
import { FONT_SIZES, normalizeFontSize } from './accessibility'

const fontLabels = {
  small: 'Small',
  default: 'Default',
  large: 'Large',
  'extra-large': 'Extra Large'
} as const

export function AccessibilitySettings({
  preferences,
  onOpenTour
}: {
  preferences: ReturnType<typeof usePreferences>
  onOpenTour: () => void
}) {
  const fontSize = normalizeFontSize(preferences.fontSize)
  const fontIndex = FONT_SIZES.indexOf(fontSize)
  const setFontAt = (index: number) => preferences.setFontSize(FONT_SIZES[index])

  return (
    <section className="accessibility-settings" aria-labelledby="accessibility-heading">
      <div className="settings-section-heading">
        <h2 id="accessibility-heading">Accessibility</h2>
        <Button variant="ghost" className="text-button" onClick={onOpenTour}>
          Accessibility Tour
        </Button>
      </div>
      <div className="settings-group">
        <p className="settings-group-label">Text</p>
        <div className="accessibility-row">
          <div>
            <strong>Font Size</strong>
            <span>Adjust text across the workspace.</span>
          </div>
          <div className="font-size-control">
            <Button
              variant="ghost"
              className="icon-button"
              title="Decrease font size"
              aria-label="Decrease font size"
              disabled={fontIndex === 0}
              onClick={() => setFontAt(fontIndex - 1)}
            >
              <Minus size={14} />
            </Button>
            <span aria-live="polite">{fontLabels[fontSize]}</span>
            <Button
              variant="ghost"
              className="icon-button"
              title="Increase font size"
              aria-label="Increase font size"
              disabled={fontIndex === FONT_SIZES.length - 1}
              onClick={() => setFontAt(fontIndex + 1)}
            >
              <Plus size={14} />
            </Button>
            <Button
              variant="ghost"
              className="icon-button"
              title="Reset font size"
              aria-label="Reset font size"
              onClick={() => preferences.setFontSize('default')}
            >
              <RotateCcw size={13} />
            </Button>
          </div>
        </div>
      </div>
      <div className="settings-group">
        <p className="settings-group-label">Visual</p>
        <ToggleRow
          label="High Contrast"
          description="Increase contrast between text and surfaces."
          value={preferences.highContrast}
          onChange={() => preferences.setHighContrast((value) => !value)}
        />
        <ToggleRow
          label="Reduce Motion"
          description="Reduce animation and transition intensity."
          value={preferences.reduceMotion}
          onChange={() => preferences.setReduceMotion((value) => !value)}
        />
      </div>
      <div className="settings-group">
        <p className="settings-group-label">Navigation</p>
        <ToggleRow
          label="Keyboard Navigation"
          description="Enable keyboard shortcuts and tool switching."
          value={preferences.keyboardNavigation}
          onChange={() => preferences.setKeyboardNavigation((value) => !value)}
        />
        <ToggleRow
          label="Enhanced Focus"
          description="Make the active keyboard focus easier to see."
          value={preferences.enhancedFocus}
          onChange={() => preferences.setEnhancedFocus((value) => !value)}
        />
        <div className="accessibility-row">
          <div>
            <strong>Focus Color</strong>
            <span>Choose the color used by the enhanced focus ring.</span>
          </div>
          <input
            className="focus-color-picker"
            type="color"
            value={preferences.focusColor}
            aria-label="Enhanced focus color"
            onChange={(event) => preferences.setFocusColor(event.target.value)}
          />
        </div>
      </div>
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
    <div className="accessibility-row">
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>
      <Button
        variant="ghost"
        className={`segmented-toggle ${value ? 'on' : ''}`}
        aria-pressed={value}
        onClick={onChange}
      >
        {value ? 'On' : 'Off'}
      </Button>
    </div>
  )
}
