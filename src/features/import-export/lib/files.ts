import type { CanvasItem } from '@/features/board/types'

// Estimate a readable starting frame; the editor keeps overflow scrollable.
export function clipboardTextSize(text: string) {
  const lines = text.split(/\r\n?|\n/)
  const longestLine = Math.max(1, ...lines.map((line) => [...line].length))
  const width = Math.max(240, Math.min(480, longestLine * 9 + 40))
  const charactersPerLine = Math.max(1, Math.floor((width - 40) / 9))
  const wrappedLines = lines.reduce(
    (total, line) => total + Math.max(1, Math.ceil([...line].length / charactersPerLine)),
    0
  )
  const height = Math.max(120, Math.min(480, wrappedLines * 28 + 32))
  return { w: width, h: height }
}

export function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// Checked in order: an .html file is imported as an html object, not as text.
const MEDIA_TYPES = [
  { type: 'image', match: (file: File) => file.type.startsWith('image/') },
  { type: 'video', match: (file: File) => file.type.startsWith('video/') },
  { type: 'html', match: (file: File) => file.name.toLowerCase().endsWith('.html') }
]

function isTextFile(file: File) {
  return file.type.startsWith('text/') || file.name.toLowerCase().endsWith('.md')
}

// Resolves to { type, data } for createObject, or null when the format is unsupported.
export async function fileToObject(
  file: File
): Promise<{ type: string; data: Partial<CanvasItem> } | null> {
  const media = MEDIA_TYPES.find((entry) => entry.match(file))
  if (media)
    return { type: media.type, data: { src: await readFileAsDataUrl(file), name: file.name } }
  if (isTextFile(file))
    return { type: 'text', data: { text: await readFileAsText(file), name: file.name } }
  return null
}
