import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import type { usePreferences } from '@/features/preferences/usePreferences'
import { useState } from 'react'
import { X } from '@/components/icons/PaperIcons'

const STEPS = [
  'Font Size',
  'High Contrast',
  'Reduce Motion',
  'Keyboard Navigation',
  'Customize & Present'
]

export function AccessibilityTour({
  isOpen,
  preferences,
  onClose
}: {
  isOpen: boolean
  preferences: ReturnType<typeof usePreferences>
  onClose: () => void
}) {
  const [step, setStep] = useState(0)

  const isLast = step === STEPS.length - 1

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        className="tour-dialog"
        showCloseButton={false}
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const content = event.currentTarget as HTMLElement
          content.focus()
        }}
      >
        <div className="tour-heading">
          <div>
            <span className="tour-progress">
              Accessibility · {step + 1} / {STEPS.length}
            </span>
            <DialogTitle>{STEPS[step]}</DialogTitle>
          </div>
          <Button
            variant="ghost"
            className="icon-button"
            title="Close accessibility tour"
            aria-label="Close accessibility tour"
            onClick={onClose}
          >
            <X size={16} />
          </Button>
        </div>
        <div className="tour-content">
          {step === 0 && <FontStep preferences={preferences} />}
          {step === 1 && <ContrastStep preferences={preferences} />}
          {step === 2 && <MotionStep preferences={preferences} />}
          {step === 3 && <KeyboardStep preferences={preferences} />}
          {step === 4 && <CustomizeStep />}
        </div>
        <div className="tour-actions">
          <Button
            variant="ghost"
            className="nav-item"
            disabled={step === 0}
            onClick={() => setStep((value) => value - 1)}
          >
            Back
          </Button>
          <Button
            variant="ghost"
            className="nav-item active"
            onClick={() =>
              isLast
                ? (preferences.setTutorialCompleted(true), onClose())
                : setStep((value) => value + 1)
            }
          >
            {isLast ? 'Finish' : 'Next'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function FontStep({ preferences }: { preferences: ReturnType<typeof usePreferences> }) {
  return (
    <div className="tour-demo-card">
      <p>Adjust the text scale and see the interface respond immediately.</p>
      <div className="tour-font-actions">
        <Button
          variant="ghost"
          className="nav-item"
          onClick={() => preferences.setFontSize('small')}
        >
          A−
        </Button>
        <Button
          variant="ghost"
          className="nav-item active"
          onClick={() => preferences.setFontSize('default')}
        >
          Default
        </Button>
        <Button
          variant="ghost"
          className="nav-item"
          onClick={() => preferences.setFontSize('large')}
        >
          A+
        </Button>
      </div>
      <strong className="tour-sample-text">Readable workspace text</strong>
    </div>
  )
}

function ContrastStep({ preferences }: { preferences: ReturnType<typeof usePreferences> }) {
  return (
    <div className="tour-demo-card">
      <p>Increase separation between surfaces, borders and text.</p>
      <Button
        variant="ghost"
        className="segmented-toggle"
        aria-pressed={preferences.highContrast}
        onClick={() => preferences.setHighContrast((value) => !value)}
      >
        {preferences.highContrast ? 'High contrast on' : 'Turn on high contrast'}
      </Button>
      <div className="tour-contrast-sample">
        <span>Selected item</span>
        <span>Secondary label</span>
      </div>
    </div>
  )
}

function MotionStep({ preferences }: { preferences: ReturnType<typeof usePreferences> }) {
  return (
    <div className="tour-demo-card">
      <p>Reduce Motion keeps feedback visible while removing distracting movement.</p>
      <Button
        variant="ghost"
        className="segmented-toggle"
        aria-pressed={preferences.reduceMotion}
        onClick={() => preferences.setReduceMotion((value) => !value)}
      >
        {preferences.reduceMotion ? 'Reduce motion on' : 'Reduce motion off'}
      </Button>
      <div className={`tour-motion-sample ${preferences.reduceMotion ? 'reduced' : ''}`} />
    </div>
  )
}

function KeyboardStep({ preferences }: { preferences: ReturnType<typeof usePreferences> }) {
  return (
    <div className="tour-demo-card">
      <p>Use Tab to reach controls, Enter to activate them and Escape to leave an overlay.</p>
      <Button
        variant="ghost"
        className="segmented-toggle"
        aria-pressed={preferences.keyboardNavigation}
        onClick={() => preferences.setKeyboardNavigation((value) => !value)}
      >
        {preferences.keyboardNavigation ? 'Keyboard navigation on' : 'Keyboard navigation off'}
      </Button>
      <div className="tour-keyboard-hint">
        <kbd>Tab</kbd>
        <span>→</span>
        <kbd>Enter</kbd>
        <span>→</span>
        <kbd>Escape</kbd>
      </div>
    </div>
  )
}

function CustomizeStep() {
  return (
    <div className="tour-demo-card">
      <p>
        Use the Customize tab in the sidebar to change themes, accent colors, auto-hide and each
        interface surface.
      </p>
      <p>
        Mark selected objects as slides from the dock, then open Presentation mode from the header.
        Marked widgets show an asterisk.
      </p>
    </div>
  )
}
