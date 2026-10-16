import type { ReactNode, SVGProps } from 'react'

type GlyphName =
  | 'arrowRight'
  | 'arrowUpToLine'
  | 'boxSelect'
  | 'camera'
  | 'check'
  | 'circleDot'
  | 'chevronDown'
  | 'chevronLeft'
  | 'chevronRight'
  | 'chevronUp'
  | 'circle'
  | 'copy'
  | 'diamond'
  | 'download'
  | 'eraser'
  | 'fileArchive'
  | 'fileCode'
  | 'fileText'
  | 'hand'
  | 'hexagon'
  | 'imagePlus'
  | 'layoutGrid'
  | 'link'
  | 'mindMap'
  | 'maximize'
  | 'menu'
  | 'minus'
  | 'panelRight'
  | 'pencil'
  | 'pentagon'
  | 'plus'
  | 'presentation'
  | 'redo'
  | 'rotate'
  | 'scissors'
  | 'settings'
  | 'shapes'
  | 'sliders'
  | 'square'
  | 'star'
  | 'sticky'
  | 'trash'
  | 'triangle'
  | 'type'
  | 'unlink'
  | 'undo'
  | 'upload'
  | 'x'
  | 'zap'

type PaperIconProps = SVGProps<SVGSVGElement> & { size?: number }

const drawings: Record<GlyphName, ReactNode> = {
  arrowRight: (
    <>
      <path d="M3.8 12.4c4.2-.4 8.4-.1 15.7-.3" />
      <path d="m14.7 7.6 4.9 4.5-4.8 4.7" />
      <path d="m4.3 9.8-.8 2.7.9 2.3" strokeDasharray="1 2" />
    </>
  ),
  arrowUpToLine: (
    <>
      <path d="M4 5.1c5.5-.2 10.1.3 16-.1" />
      <path d="M12 19.4V8.1m0 0-4.2 4.2M12 8.1l4.1 4.2" />
      <path d="m9.7 18.9 2.4.5 2.2-.6" strokeDasharray="1 2" />
    </>
  ),
  boxSelect: (
    <>
      <path d="M5.2 4.5H18l.4 3.8M18.6 11v7.8H6.1l-.4-4.2M5.2 10V5" strokeDasharray="5 1.3" />
      <path d="M8.2 8.5 8 16l7.8-.3" />
      <circle cx="5" cy="4.7" r="1" fill="currentColor" stroke="none" />
      <circle cx="18.3" cy="18.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  camera: (
    <>
      <path d="m4 8.1 3.2-.2 1.5-2h6.1l1.5 2.1 3.4.1c.6 0 1 .6 1 1.1v8.2c0 .7-.4 1.1-1.1 1.1H4.3c-.7 0-1.1-.5-1.1-1.1V9.2c0-.6.3-1 1-1.1Z" />
      <circle cx="12" cy="13.1" r="3.2" />
      <path d="m6 10.4.9-.1m10.1-.1.7.3" strokeDasharray="1 1.8" />
    </>
  ),
  check: (
    <>
      <path d="m4.4 12.6 4.6 4.1 10.4-10" />
      <path d="m5.5 12.4 3.3 3" strokeDasharray="1 1.6" />
    </>
  ),
  circleDot: (
    <>
      <circle cx="12" cy="12" r="8.1" />
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 2.7v1.6m0 15.4v1.6M2.7 12h1.6m15.4 0h1.6" strokeDasharray="1 1.7" />
    </>
  ),
  chevronDown: (
    <>
      <path d="m5.2 8.9 6.7 6.4 6.9-6.5" />
      <path d="m8.2 9.3 3.6 3.2 3.4-3.2" strokeDasharray="1 1.5" />
    </>
  ),
  chevronLeft: (
    <>
      <path d="m14.8 4.8-6.1 7.1 6.2 7.2" />
      <path d="m13.7 7.4-3.9 4.5 3.8 4.5" strokeDasharray="1 1.8" />
    </>
  ),
  chevronRight: (
    <>
      <path d="m9.1 4.8 6.2 7.1-6.2 7.2" />
      <path d="m10.3 7.4 3.8 4.5-3.8 4.5" strokeDasharray="1 1.8" />
    </>
  ),
  chevronUp: (
    <>
      <path d="m5.2 15.2 6.7-6.4 6.9 6.5" />
      <path d="m8.2 14.7 3.6-3.2 3.4 3.2" strokeDasharray="1 1.5" />
    </>
  ),
  circle: (
    <>
      <path d="M12.1 3.7c4.5.1 8.1 3.8 8 8.3-.1 4.6-3.6 8.1-8.2 8.2-4.5 0-8-3.7-8-8.2s3.5-8.2 8.2-8.3Z" />
      <path d="M8 5.2c-1.7 1.1-2.8 3-3 5.1" strokeDasharray="1 1.8" />
    </>
  ),
  copy: (
    <>
      <path d="M8.1 7.2V4.8c0-.6.4-.9 1-.9h9.5c.6 0 .9.4.9 1v10.7c0 .6-.3.9-1 .9h-2.3" />
      <path d="M5 8h9.4c.7 0 1 .4 1 1v10.1c0 .6-.4.9-1 .9H5c-.6 0-1-.3-1-.9V9c0-.6.4-1 1-1Z" />
      <path d="M7.1 11.2h5.2m-5.2 2.4h5.2" strokeDasharray="2 1" />
    </>
  ),
  diamond: (
    <>
      <path d="m12 3.5 8.1 8.4-8 8.5-8.2-8.3L12 3.5Z" />
      <path d="m7.1 11.4 4.9-5.1 4.8 5.2" strokeDasharray="1 1.8" />
    </>
  ),
  download: (
    <>
      <path d="M4.1 15.7v3.1c0 .5.5.8 1 .8h13.8c.6 0 1-.3 1-.9v-3" />
      <path d="M12 4v11.2m0 0 4.4-4.3m-4.4 4.3-4.2-4.3" />
      <path d="M7 18h.8m8.2 0h.8" strokeDasharray="1 1" />
    </>
  ),
  eraser: (
    <>
      <path d="m4.6 14.2 8.8-9.1c.6-.6 1.4-.6 2 0l4.1 4c.6.6.6 1.4 0 2L11 19.8H7.1l-2.5-2.4c-.9-.9-.9-2.2 0-3.2Z" />
      <path d="m9 10 6.2 6.1m-3.7 3.7 4.8-5m-8.9 5h12.1" />
    </>
  ),
  fileArchive: (
    <>
      <path d="M6 3.8h8l4 4v12.1H6.1c-.6 0-.9-.4-.9-1V4.7c0-.6.3-.9.8-.9Z" />
      <path d="M13.7 4v4.2h4.1M10 4.2v2h2v2h-2v2h2v2h-2v2h2v4.7" />
      <path d="M10 15.8h2" strokeDasharray=".5 1.3" />
    </>
  ),
  fileCode: (
    <>
      <path d="M5.1 3.8h8.1l4.7 4.5v11.1c0 .5-.3.8-.9.8H5.1c-.6 0-.9-.4-.9-1V4.7c0-.6.3-.9.9-.9Z" />
      <path d="M13 4v4.7h4.4M9.1 11.1l-2 2 2 2m5.7-4 2 2-2 2m-1.5-5.2-1.1 6" />
      <path d="M7.2 18.2h5.1" strokeDasharray="1 1.7" />
    </>
  ),
  fileText: (
    <>
      <path d="M5.1 3.8h8.1l4.7 4.5v11.1c0 .5-.3.8-.9.8H5.1c-.6 0-.9-.4-.9-1V4.7c0-.6.3-.9.9-.9Z" />
      <path d="M13 4v4.7h4.4M7.4 11h6.8m-6.8 3.1h6.8m-6.8 3h4.4" />
      <path d="M8 12.1h5.4m-5.4 3h5.4" strokeDasharray="1 2" />
    </>
  ),
  hand: (
    <>
      <path d="M7.1 12.1V6.6a1.2 1.2 0 0 1 2.4 0v4.1-5.9a1.2 1.2 0 0 1 2.4 0v5.4-4.1a1.2 1.2 0 0 1 2.4 0v4.5-2.7a1.2 1.2 0 0 1 2.4 0v6.2c0 3.4-2.2 5.5-5.7 5.5h-.8c-1.8 0-3-.8-4-2.3l-2.5-3.1a1.3 1.3 0 0 1 2-1.7l1.4 1.4Z" />
      <path d="M9.6 9.4v1.9m2.3-1.4v1.5m2.4-.8v1.1" strokeDasharray="1 1.5" />
    </>
  ),
  hexagon: (
    <>
      <path d="m7.4 4.2 9.2.1 4.5 7.8-4.6 7.7H7.3l-4.2-7.7 4.3-7.9Z" />
      <path d="m7.5 5.7-3.1 6.2m5.1-6.2 7.2.1" strokeDasharray="1 1.5" />
    </>
  ),
  imagePlus: (
    <>
      <path d="M4.3 5.1h13c.8 0 1.2.4 1.2 1.2v7.9M4.1 17.9h8.6" />
      <path d="M4.2 5.4v12.1c0 .4.3.7.7.7m1.4-3.2 3.2-3.6 2.5 2.6 1.7-1.8" />
      <circle cx="14.4" cy="8.8" r="1.2" />
      <path d="M18 15.2v6m-3-3h6" />
    </>
  ),
  layoutGrid: (
    <>
      <path d="M4.2 4.1h6.5v6.4H4.2zM13.3 4.1h6.4v6.4h-6.4zM4.2 13.2h6.5v6.5H4.2zM13.3 13.2h6.4v6.5h-6.4z" />
      <path d="m5.1 5.2 1 .1m8.1 8.9 1.3.1" strokeDasharray="1 1.5" />
    </>
  ),
  link: (
    <>
      <path d="M9.2 14.8 7.7 16.4a3.2 3.2 0 0 1-4.5-4.5l3.5-3.5a3.1 3.1 0 0 1 4.5 0m3.6.8 1.5-1.5a3.2 3.2 0 0 1 4.5 4.5l-3.5 3.5a3.1 3.1 0 0 1-4.5 0m-3.6-.8 4.5-4.5" />
      <path d="m9.9 10.3 4.2 3.4" strokeDasharray="1 1.8" />
    </>
  ),
  mindMap: (
    <>
      <path d="M6.1 12.4c2.7-4.3 6.6-4.9 9.1-1.1 1.7 2.6 3.5 3.1 5.4 1.2" />
      <path d="M8 11.1c.2 2.7 1.3 4.1 3.4 4.2 2 .1 3.3-1.1 4-3.4" />
      <circle cx="5.4" cy="13.2" r="2.5" fill="var(--paper, #fffdf7)" />
      <circle cx="20.2" cy="12.5" r="2.2" fill="var(--paper, #fffdf7)" />
      <circle cx="11.7" cy="17.3" r="2.1" fill="var(--paper, #fffdf7)" />
      <path
        d="m4.3 5.4 1.1-1.7m1.4 2.1 1.1-1.7m8.3 12.3 1 1.8m1.4-2.2 1.1 1.7"
        strokeDasharray="1 1.8"
      />
    </>
  ),
  maximize: (
    <>
      <path d="M9.2 4.4H4.4v4.8m10.4-4.8h4.8v4.8M4.4 15v4.7h4.8m10.4-4.7v4.7h-4.8" />
      <path d="m4.8 4.8 4.1 4m10.3-4-4.1 4m-10.3 10 4.1-4m10.3 4-4.1-4" strokeDasharray="4 2" />
    </>
  ),
  menu: (
    <>
      <path d="M5 6.2c4.5-.2 8.3.2 14-.1M5 12.1c4.2.2 8.5-.2 13.9.1M5 18c3.7-.2 7.2.1 10.4 0" />
      <circle cx="3.6" cy="6.2" r=".8" fill="currentColor" stroke="none" />
      <circle cx="3.6" cy="12.1" r=".8" fill="currentColor" stroke="none" />
      <circle cx="3.6" cy="18" r=".8" fill="currentColor" stroke="none" />
    </>
  ),
  minus: (
    <>
      <path d="M4.2 12.3c4.8-.3 9.8.2 15.6-.1" />
      <path d="m7 10.8 9.8.2" strokeDasharray="1 2" />
    </>
  ),
  panelRight: (
    <>
      <path d="M4.1 4.2h15.8v15.5H4.1z" />
      <path d="M13.8 4.6v14.6M6.3 7.2h5.3m-5.3 3h4m-4 3.1h4" />
      <path d="m15.3 7.3 2 .1m-2 3.1 2 .1m-2 3 2 .1" strokeDasharray="1 1.4" />
    </>
  ),
  pencil: (
    <>
      <path d="m4.1 16.8 10.8-11c.7-.7 1.4-.6 2.1.1l2 2c.6.6.7 1.3 0 2L8.1 20.2l-4.5.7.5-4.1Z" />
      <path d="m13.7 7.2 4.1 4m-13 5.6 2.4 2.5m1.1-3.7 7.6-7.7" />
      <path d="m5.2 19.3 1.6-.3" strokeDasharray=".5 1" />
    </>
  ),
  pentagon: (
    <>
      <path d="m12 3.6 8.2 5.9-3.1 9.6H6.8L3.7 9.5 12 3.6Z" />
      <path d="m12.1 5.1 6.4 4.6m-12.7.1 1.9 6.9" strokeDasharray="1 1.7" />
    </>
  ),
  plus: (
    <>
      <path d="M12.1 4.3v15.4M4.4 12.1h15.2" />
      <path d="m11.3 7 .2 10m-3.7-5.7h9.4" strokeDasharray="1 2" />
    </>
  ),
  presentation: (
    <>
      <path d="M4 4.3h16v11.5H4zM12 15.8v4.1m-4.3 0h8.6" />
      <path d="m7.2 12 3-3.1 2.4 2.2 3.5-4m-1.9.2 2.1-.2-.2 2" />
      <path d="M5.4 5.8h13.1" strokeDasharray="1 2" />
    </>
  ),
  redo: (
    <>
      <path d="M19.6 10.4c-1.8-3-4.4-4.4-7.7-4.2-3.5.2-6.1 2.6-6.7 6.1-.4 2.8 1 5.1 3.6 6.4" />
      <path d="m15.4 6.1 4.2-.1-.3 4.2" />
      <path d="M8.6 18.3c1.2.7 2.4 1 3.8 1" strokeDasharray="1 1.7" />
    </>
  ),
  rotate: (
    <>
      <path d="M5.2 8.2a7.6 7.6 0 1 1-1 6.6" />
      <path d="M4.3 3.8 4 8.4l4.5-.3" />
      <path d="M11.9 8.1v4.2l2.8 1.7" />
    </>
  ),
  scissors: (
    <>
      <circle cx="6.4" cy="6.2" r="2.3" />
      <circle cx="6.4" cy="17.8" r="2.3" />
      <path d="m8.4 7.6 11.3 8.7M8.4 16.4l11.3-8.8M11.4 12l-3 0" />
      <path d="m16.9 9.7 2-2.2m-2 6.9 2 2.1" strokeDasharray="1 1.5" />
    </>
  ),
  settings: (
    <>
      <path d="m9.1 4.3.7-1h4.1l.6 1.1.4 1.6 1.6.9 1.7-.3 1.3 3.5-1.3 1.1v1.8l1.1 1.4-1.8 3.2-1.7-.5-1.5.9-.6 1.7H9.5l-.6-1.7-1.6-.8-1.6.4-1.5-3.3 1.2-1.4v-1.8l-1.2-1.2 1.6-3.3 1.6.4 1.6-.9.1-1.8Z" />
      <circle cx="11.9" cy="11.9" r="3.1" />
      <path d="m10.8 12 1 .9 1.7-2" strokeDasharray="1 2" />
    </>
  ),
  shapes: (
    <>
      <path d="M4.1 15.9 8 7.1l4.2 8.8H4.1Z" />
      <path d="m14.3 5.1 5.7 5.8-5.6 5.8-5.7-5.8 5.6-5.8Z" />
      <circle cx="16.4" cy="18.3" r="2" />
      <path d="m5.1 14.1 2-4.3 2 4.3" strokeDasharray="1 1.8" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6.2c4.4-.2 8.7.2 16-.1M4 12c4.7.2 9-.2 16 .1M4 17.8c4.5-.2 9 .1 16 0" />
      <circle cx="9" cy="6.1" r="2" fill="var(--paper, #fffdf7)" />
      <circle cx="15.5" cy="12.1" r="2" fill="var(--paper, #fffdf7)" />
      <circle cx="7" cy="17.8" r="2" fill="var(--paper, #fffdf7)" />
      <path d="M4.9 6.2h2.1m2 5.8h4.5m-6.5 5.8h10.5" strokeDasharray="1 1.5" />
    </>
  ),
  square: (
    <>
      <path d="M4.2 4.4h15.4v15.3H4.2z" />
      <path d="m5.7 5.7 3.6.1m7.8 12.5h1.1" strokeDasharray="1 1.5" />
    </>
  ),
  star: (
    <>
      <path d="m12.2 3.4 2.2 5.7 6.1.4-4.7 4 1.5 6-5.2-3.2-5.2 3.1 1.6-5.9-4.7-4.1 6.1-.3 2.3-5.7Z" />
      <path d="m12.2 5.5 1.5 4.3m-7.1.7 3.7 3.1" strokeDasharray="1 1.6" />
    </>
  ),
  sticky: (
    <>
      <path d="M4.2 4.1h11.9l3.8 3.8v11.9H4.2z" />
      <path d="M15.7 4.6v3.7h3.6M7.1 10.8h8.1m-8.1 3h6.5m-6.5 3h5.3" />
      <path d="M7.4 11.8h5.7m-5.7 3h4.2" strokeDasharray="1 2" />
    </>
  ),
  trash: (
    <>
      <path d="M5.4 7.2h13.2m-10.8 0 .7 12.2h7.1l.8-12.2M9 7V4.5h6V7m-3-1v.2" />
      <path d="M10 10.2v6.6m4-6.6v6.6" />
      <path d="m7.8 8.8.5 9.2m7.4-9.2-.5 9.2" strokeDasharray="1 1.7" />
    </>
  ),
  triangle: (
    <>
      <path d="m12.1 3.7 8.2 16.2H3.8l8.3-16.2Z" />
      <path d="m12 6.2 5.7 11.3m-11.2-.1 1.1-2.1" strokeDasharray="1 1.8" />
    </>
  ),
  type: (
    <>
      <path d="M4.1 6.1V4.3h15.8v1.8M12 4.5v15.1m-3.1 0h6.2" />
      <path d="M6 5.4h11.8m-5.1 1.7v9.5" strokeDasharray="1 2" />
    </>
  ),
  unlink: (
    <>
      <path d="m9 14.7-1.5 1.6A3.2 3.2 0 0 1 3 11.8l3.5-3.5a3.1 3.1 0 0 1 4.4 0m3.7.8 1.5-1.5a3.2 3.2 0 0 1 4.5 4.5l-3.5 3.5a3.1 3.1 0 0 1-4.5 0" />
      <path d="m4.7 19.4 14.6-14.8" />
      <path d="m9.9 10.4 4.2 3.4" strokeDasharray="1 1.8" />
    </>
  ),
  undo: (
    <>
      <path d="M4.4 10.3c1.8-3 4.4-4.4 7.7-4.2 3.5.2 6.1 2.6 6.7 6.1.4 2.8-1 5.1-3.6 6.4" />
      <path d="m8.6 6  -4.2-.1.3 4.2" />
      <path d="M15.4 18.3c-1.2.7-2.4 1-3.8 1" strokeDasharray="1 1.7" />
    </>
  ),
  upload: (
    <>
      <path d="M4.1 14.4v4.5c0 .5.4.8.9.8h14c.5 0 .9-.4.9-.9v-4.3" />
      <path d="M12 16.1V4.4m0 0L7.7 8.8M12 4.4l4.2 4.4" />
      <path d="M6.1 17.2h.8m10.1 0h.8" strokeDasharray="1 1" />
    </>
  ),
  x: (
    <>
      <path d="m5.5 4.8 13.1 14.5m-.4-14.1L5.7 19" />
      <path d="m7 6.4 2.5 2.8m5.8 6.1 2.3 2.5" strokeDasharray="1 1.7" />
    </>
  ),
  zap: (
    <>
      <path d="m13.5 3.3-8 10h5l-.1 7.4 7.8-10h-5.1l.4-7.4Z" />
      <path d="m12.8 5.8-.2 3.3m2.2 3.5-2.7 3.4" strokeDasharray="1 1.5" />
    </>
  )
}

function makeIcon(glyph: GlyphName) {
  function PaperIcon({ size = 18, strokeWidth = 1.65, ...props }: PaperIconProps) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        {...props}
      >
        {drawings[glyph]}
      </svg>
    )
  }
  PaperIcon.displayName = `PaperIcon(${glyph})`
  return PaperIcon
}

export const ArrowRight = makeIcon('arrowRight')
export const ArrowUpToLine = makeIcon('arrowUpToLine')
export const BoxSelect = makeIcon('boxSelect')
export const Camera = makeIcon('camera')
export const Check = makeIcon('check')
export const CheckIcon = Check
export const CircleDot = makeIcon('circleDot')
export const ChevronDownIcon = makeIcon('chevronDown')
export const ChevronLeft = makeIcon('chevronLeft')
export const ChevronRight = makeIcon('chevronRight')
export const ChevronRightIcon = ChevronRight
export const ChevronUpIcon = makeIcon('chevronUp')
export const Circle = makeIcon('circle')
export const Copy = makeIcon('copy')
export const Diamond = makeIcon('diamond')
export const Download = makeIcon('download')
export const Eraser = makeIcon('eraser')
export const FileArchive = makeIcon('fileArchive')
export const FileCode2 = makeIcon('fileCode')
export const FileText = makeIcon('fileText')
export const Hand = makeIcon('hand')
export const Hexagon = makeIcon('hexagon')
export const ImagePlus = makeIcon('imagePlus')
export const LayoutGrid = makeIcon('layoutGrid')
export const Link2 = makeIcon('link')
export const Maximize = makeIcon('maximize')
export const Menu = makeIcon('menu')
export const MindMap = makeIcon('mindMap')
export const Minus = makeIcon('minus')
export const PanelRight = makeIcon('panelRight')
export const Pencil = makeIcon('pencil')
export const PencilLine = Pencil
export const Pentagon = makeIcon('pentagon')
export const Plus = makeIcon('plus')
export const Presentation = makeIcon('presentation')
export const Redo2 = makeIcon('redo')
export const RotateCcw = makeIcon('rotate')
export const Scissors = makeIcon('scissors')
export const Settings2 = makeIcon('settings')
export const Shapes = makeIcon('shapes')
export const SlidersHorizontal = makeIcon('sliders')
export const Square = makeIcon('square')
export const Star = makeIcon('star')
export const StickyNote = makeIcon('sticky')
export const Trash2 = makeIcon('trash')
export const Triangle = makeIcon('triangle')
export const Type = makeIcon('type')
export const Undo2 = makeIcon('undo')
export const Unlink = makeIcon('unlink')
export const Upload = makeIcon('upload')
export const X = makeIcon('x')
export const XIcon = X
export const Zap = makeIcon('zap')
