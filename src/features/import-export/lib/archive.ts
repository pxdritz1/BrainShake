import JSZip from 'jszip'
import { boardFilename, downloadBlob } from './download'
import type { Board } from '@/features/board/types'
import { isBoardData } from '@/features/board/types'
import { normalizeBoardShapes } from '@/features/board/lib/objects'
import type { WorkspaceDocument } from '@/features/workspace/model'
import { isWorkspaceDocument } from '@/features/workspace/model'
import {
  extractMedia,
  referencedMediaPaths,
  restoreMedia,
  validateMediaAssets
} from '@/features/workspace/media'

export type BrainshakeImport =
  | { kind: 'workspace'; data: WorkspaceDocument; assets: Map<string, Blob> }
  | { kind: 'board'; data: Pick<Board, 'name' | 'objects'> }

export async function createWorkspaceArchive(
  document: WorkspaceDocument,
  savedAssets = new Map<string, Blob>()
): Promise<Blob> {
  if (!isWorkspaceDocument(document)) throw Error('Invalid workspace')
  const assets = new Map(savedAssets)
  const cache = new Map<string, Promise<{ path: string; mediaType: string }>>()
  const boards = await extractMedia(document.boards.map(normalizeBoardShapes), assets, cache)
  const snapshots = await Promise.all(
    document.snapshots.map(async (snapshot) => ({
      ...snapshot,
      boards: await extractMedia(snapshot.boards.map(normalizeBoardShapes), assets, cache)
    }))
  )
  for (const path of referencedMediaPaths([...boards, ...snapshots.flatMap((item) => item.boards)]))
    if (!assets.has(path)) throw Error('Missing workspace media asset')
  const zip = new JSZip()
  zip.file('manifest.json', JSON.stringify({ ...document, boards, snapshots }, null, 2))
  for (const [path, blob] of assets) zip.file(path, blob, { compression: 'STORE' })
  return zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })
}

export async function exportBrainshake(document: WorkspaceDocument, assets?: Map<string, Blob>) {
  const blob = await createWorkspaceArchive(document, assets)
  downloadBlob(blob, boardFilename(document.name, 'brainshake'))
}

export function exportJson(board: Board) {
  const objects = board.objects.map((item) => {
    if (!['image', 'video', 'html'].includes(item.type) || !('src' in item)) return { ...item }
    const { src, ...withoutSrc } = item
    return { ...withoutSrc, mediaOmitted: true }
  })
  downloadBlob(
    new Blob([JSON.stringify({ name: board.name, objects }, null, 2)], {
      type: 'application/json'
    }),
    boardFilename(board.name, 'json')
  )
}

export async function importBrainshake(file: Blob): Promise<BrainshakeImport> {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes))
    if (!isBoardData(data)) throw Error('Invalid board')
    return { kind: 'board', data }
  }

  const zip = await JSZip.loadAsync(buffer)
  const manifest = zip.file('manifest.json')
  if (manifest) {
    const data: unknown = JSON.parse(await manifest.async('text'))
    if (!isWorkspaceDocument(data)) throw Error('Unsupported workspace format')
    const paths = referencedMediaPaths([
      ...data.boards,
      ...data.snapshots.flatMap((snapshot) => snapshot.boards)
    ])
    const assets = new Map<string, Blob>()
    await Promise.all(
      paths.map(async (path) => {
        const blob = await zip.file(path)?.async('blob')
        if (!blob) throw Error('Missing media asset')
        assets.set(path, blob)
      })
    )
    await validateMediaAssets(paths, async (path) => assets.get(path))
    const getAsset = async (path: string) => assets.get(path)
    const boards = await restoreMedia(data.boards, getAsset)
    return { kind: 'workspace', data: { ...data, boards }, assets }
  }

  // The first .brainshake files held exactly one board in board.json.
  const legacyFile = zip.file('board.json')
  if (!legacyFile) throw Error('Missing board')
  const data: unknown = JSON.parse(await legacyFile.async('text'))
  if (!isBoardData(data)) throw Error('Invalid board')
  const legacyBoard: Board = {
    id: data.id || 'legacy-board',
    name: data.name,
    objects: data.objects
  }
  const [restored] = await restoreMedia([legacyBoard], async (path) =>
    zip.file(path)?.async('blob')
  )
  return { kind: 'board', data: { name: restored.name, objects: restored.objects } }
}
