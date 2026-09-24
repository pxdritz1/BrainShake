import { beforeAll, describe, expect, it, vi } from 'vitest'
import JSZip from 'jszip'
import 'fake-indexeddb/auto'
import type { Board } from '@/features/board/types'
import { createWorkspaceArchive, importBrainshake } from '@/features/import-export/lib/archive'
import { STORAGE_KEYS } from '@/features/board/lib/storage'
import { commitWorkspaceImport } from './import'
import {
  isValidSnapshotGraph,
  isWorkspaceDocument,
  type WorkspaceDocument,
  type WorkspaceSnapshot
} from './model'
import { createWorkspaceOperationGate, WorkspaceBusyError } from './operationGate'
import {
  listSnapshots,
  loadArchiveSnapshots,
  loadSnapshot,
  replaceSnapshots,
  saveSnapshot
} from './storage'

beforeAll(() => {
  // Node has Blob but no FileReader; archive import and IndexedDB restore use its browser API.
  vi.stubGlobal(
    'FileReader',
    class {
      result: string | null = null
      onload: (() => void) | null = null
      onerror: (() => void) | null = null

      async readAsDataURL(blob: Blob) {
        try {
          const bytes = await blob.arrayBuffer()
          this.result = `data:${blob.type};base64,${Buffer.from(bytes).toString('base64')}`
          this.onload?.()
        } catch {
          this.onerror?.()
        }
      }
    }
  )
})

const image = 'data:image/png;base64,aGVsbG8='
const board: Board = {
  id: 'board-one',
  name: 'Original idea',
  objects: [{ id: 'image-one', type: 'image', x: 0, y: 0, w: 100, h: 100, src: image }]
}
const secondBoard: Board = { id: 'board-two', name: 'Notes', objects: [] }
const snapshot: WorkspaceSnapshot = {
  id: 'snapshot-monday',
  parentId: null,
  label: 'Monday original idea',
  createdAt: '2026-09-21T12:00:00.000Z',
  activeBoardId: board.id,
  boards: [board, secondBoard]
}
const workspace: WorkspaceDocument = {
  format: 'brainshake',
  schemaVersion: 2,
  id: 'workspace-one',
  name: 'Ideas',
  activeBoardId: secondBoard.id,
  headSnapshotId: snapshot.id,
  boards: [board, secondBoard],
  snapshots: [snapshot]
}

describe('.brainshake archive', () => {
  it('round trips all boards and snapshots with one copy of shared media', async () => {
    const blob = await createWorkspaceArchive(workspace)
    const zip = await JSZip.loadAsync(await blob.arrayBuffer())
    const media = Object.keys(zip.files).filter(
      (path) => path.startsWith('media/') && !zip.files[path].dir
    )
    expect(media).toHaveLength(1)
    expect(zip.file('manifest.json')).not.toBeNull()

    const imported = await importBrainshake(blob)
    expect(imported.kind).toBe('workspace')
    if (imported.kind !== 'workspace') return
    expect(imported.data.boards).toHaveLength(2)
    expect(imported.data.snapshots[0].parentId).toBeNull()
    expect(imported.data.boards[0].objects[0]).toMatchObject({ src: image })
    expect(imported.data.snapshots[0].boards[0].objects[0]).toMatchObject({
      src: expect.stringMatching(/^media\//)
    })
    await replaceSnapshots(imported.data.snapshots, imported.assets)
    expect((await loadSnapshot(snapshot.id)).boards[0].objects[0]).toMatchObject({ src: image })
  })

  it('reads a legacy board ZIP and JSON export', async () => {
    const zip = new JSZip()
    zip.file(
      'board.json',
      JSON.stringify({
        name: board.name,
        objects: [{ ...board.objects[0], src: 'media/image-one.png', mediaType: 'image/png' }]
      })
    )
    zip.file('media/image-one.png', 'aGVsbG8=', { base64: true })
    const legacy = await importBrainshake(await zip.generateAsync({ type: 'blob' }))
    expect(legacy).toMatchObject({
      kind: 'board',
      data: { name: board.name, objects: [{ src: image }] }
    })

    const json = await importBrainshake(new Blob([JSON.stringify({ name: 'Plain', objects: [] })]))
    expect(json).toMatchObject({ kind: 'board', data: { name: 'Plain' } })
  })

  it('rejects an unknown format version', async () => {
    const zip = new JSZip()
    zip.file('manifest.json', JSON.stringify({ ...workspace, schemaVersion: 3 }))
    await expect(importBrainshake(await zip.generateAsync({ type: 'blob' }))).rejects.toThrow()
  })

  it('rejects a cyclic snapshot history', async () => {
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({ ...workspace, snapshots: [{ ...snapshot, parentId: snapshot.id }] })
    )
    await expect(importBrainshake(await zip.generateAsync({ type: 'blob' }))).rejects.toThrow()
  })

  it('rejects an archive with a missing media asset', async () => {
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        ...workspace,
        boards: [
          {
            ...board,
            objects: [{ ...board.objects[0], src: 'media/missing.png', mediaType: 'image/png' }]
          },
          secondBoard
        ]
      })
    )
    await expect(importBrainshake(await zip.generateAsync({ type: 'blob' }))).rejects.toThrow(
      'Missing media asset'
    )
  })

  it.each([
    { src: 'media/../invalid.png', mediaType: 'image/png' },
    { src: 'media/missing-type.png', mediaType: undefined }
  ])('rejects an unrestorable snapshot media reference: %j', async (reference) => {
    const zip = new JSZip()
    zip.file(
      'manifest.json',
      JSON.stringify({
        ...workspace,
        snapshots: [
          {
            ...snapshot,
            boards: [{ ...board, objects: [{ ...board.objects[0], ...reference }] }, secondBoard]
          }
        ]
      })
    )
    await expect(importBrainshake(await zip.generateAsync({ type: 'blob' }))).rejects.toThrow(
      'Invalid media reference'
    )
  })
})

describe('snapshot relationships', () => {
  const chain = [
    snapshot,
    { ...snapshot, id: 'snapshot-tuesday', parentId: snapshot.id },
    { ...snapshot, id: 'snapshot-wednesday', parentId: 'snapshot-tuesday' }
  ]

  it('accepts a valid chain and rejects broken relationships', () => {
    expect(isValidSnapshotGraph(chain, 'snapshot-wednesday')).toBe(true)
    expect(isValidSnapshotGraph([{ ...snapshot, parentId: 'missing' }])).toBe(false)
    expect(isValidSnapshotGraph([{ ...snapshot, parentId: snapshot.id }])).toBe(false)
    expect(
      isValidSnapshotGraph([
        { ...snapshot, parentId: 'snapshot-tuesday' },
        { ...snapshot, id: 'snapshot-tuesday', parentId: 'snapshot-wednesday' },
        { ...snapshot, id: 'snapshot-wednesday', parentId: snapshot.id }
      ])
    ).toBe(false)
    expect(isValidSnapshotGraph([snapshot], 'missing')).toBe(false)
  })

  it('requires workspace active board and snapshot head relationships', () => {
    expect(isWorkspaceDocument(workspace)).toBe(true)
    expect(isWorkspaceDocument({ ...workspace, activeBoardId: 'missing' })).toBe(false)
    expect(isWorkspaceDocument({ ...workspace, headSnapshotId: 'missing' })).toBe(false)
  })
})

class MemoryStorage {
  private values = new Map<string, string>()
  rejectBoards = false

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  setItem(key: string, value: string) {
    if (this.rejectBoards && key === STORAGE_KEYS.boards && value !== this.values.get(key))
      throw Error('QuotaExceededError')
    this.values.set(key, value)
  }

  removeItem(key: string) {
    this.values.delete(key)
  }
}

describe('workspace replacement', () => {
  it('does not replace snapshots when imported boards exceed browser storage quota', async () => {
    await replaceSnapshots([snapshot])
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEYS.boards, 'previous boards')
    storage.rejectBoards = true
    let activated = false

    await expect(
      commitWorkspaceImport(
        workspace,
        () => replaceSnapshots([]),
        () => {
          activated = true
        },
        storage
      )
    ).rejects.toThrow('QuotaExceededError')
    expect((await listSnapshots()).map((item) => item.id)).toEqual([snapshot.id])
    expect(activated).toBe(false)
    expect(storage.getItem(STORAGE_KEYS.boards)).toBe('previous boards')
    await replaceSnapshots([])
  })

  it('rolls back the working copy if replacing snapshots fails', async () => {
    const storage = new MemoryStorage()
    storage.setItem(STORAGE_KEYS.boards, 'previous boards')
    storage.setItem(STORAGE_KEYS.workspaceId, 'previous workspace')
    storage.setItem(STORAGE_KEYS.snapshotHead, 'previous head')

    await expect(
      commitWorkspaceImport(
        workspace,
        async () => {
          expect(JSON.parse(storage.getItem(STORAGE_KEYS.boards)!)).toEqual(workspace.boards)
          throw Error('IndexedDB failed')
        },
        () => {
          throw Error('Should not activate')
        },
        storage
      )
    ).rejects.toThrow('IndexedDB failed')
    expect(storage.getItem(STORAGE_KEYS.boards)).toBe('previous boards')
    expect(storage.getItem(STORAGE_KEYS.workspaceId)).toBe('previous workspace')
    expect(storage.getItem(STORAGE_KEYS.snapshotHead)).toBe('previous head')
  })

  it('persists boards and identity before replacing snapshots', async () => {
    const storage = new MemoryStorage()
    let activated = false
    await commitWorkspaceImport(
      workspace,
      async () => {
        expect(JSON.parse(storage.getItem(STORAGE_KEYS.boards)!)).toEqual(workspace.boards)
        expect(storage.getItem(STORAGE_KEYS.snapshotHead)).toBe(snapshot.id)
      },
      () => {
        activated = true
      },
      storage
    )
    expect(activated).toBe(true)
  })
})

describe('workspace operation gate', () => {
  it('blocks import during save or restore and blocks those operations during import', async () => {
    const gate = createWorkspaceOperationGate()
    for (const activeOperation of ['save', 'restore', 'import']) {
      let finish!: () => void
      const running = gate.run(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve
          })
      )
      await expect(gate.run(async () => activeOperation)).rejects.toBeInstanceOf(WorkspaceBusyError)
      finish()
      await running
    }
    await expect(gate.run(async () => 'ready')).resolves.toBe('ready')
  })
})

describe('local snapshots', () => {
  it('normalizes legacy shape proportions when saving and restoring snapshots', async () => {
    const legacyShapeSnapshot: WorkspaceSnapshot = {
      ...snapshot,
      id: 'legacy-shape-snapshot',
      activeBoardId: 'legacy-shape-board',
      boards: [
        {
          id: 'legacy-shape-board',
          name: 'Legacy shape',
          objects: [{ id: 'stretched', type: 'shape', x: 10, y: 20, w: 250, h: 180 }]
        }
      ]
    }
    await saveSnapshot(legacyShapeSnapshot)
    const restored = await loadSnapshot(legacyShapeSnapshot.id)
    expect(restored.boards[0].objects[0]).toMatchObject({ x: 45, y: 20, w: 180, h: 180 })
  })

  it('persists named versions and restores their shared media', async () => {
    await replaceSnapshots([])
    await saveSnapshot(snapshot)
    await saveSnapshot({
      ...snapshot,
      id: 'snapshot-tuesday',
      parentId: snapshot.id,
      label: 'Tuesday simplified concept',
      createdAt: '2026-09-22T12:00:00.000Z'
    })
    expect((await listSnapshots()).map((item) => item.label)).toEqual([
      'Tuesday simplified concept',
      'Monday original idea'
    ])
    expect((await loadSnapshot(snapshot.id)).boards[0].objects[0]).toMatchObject({ src: image })
    const archiveData = await loadArchiveSnapshots()
    expect(archiveData.assets.size).toBe(1)
    const portable = await createWorkspaceArchive(
      { ...workspace, snapshots: archiveData.snapshots },
      archiveData.assets
    )
    expect(
      (await JSZip.loadAsync(await portable.arrayBuffer())).file('manifest.json')
    ).not.toBeNull()
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open('brainshake-workspace-v2')
      opening.onsuccess = () => resolve(opening.result)
      opening.onerror = () => reject(opening.error)
    })
    const assetCount = await new Promise<number>((resolve, reject) => {
      const count = database.transaction('assets', 'readonly').objectStore('assets').count()
      count.onsuccess = () => resolve(count.result)
      count.onerror = () => reject(count.error)
    })
    database.close()
    expect(assetCount).toBe(1)
    await replaceSnapshots([])
    expect(await listSnapshots()).toEqual([])
  })

  it('rolls back snapshots and assets when the replacement transaction fails', async () => {
    await replaceSnapshots([snapshot])
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open('brainshake-workspace-v2')
      opening.onsuccess = () => resolve(opening.result)
      opening.onerror = () => reject(opening.error)
    })
    const originalPut = IDBObjectStore.prototype.put
    let failed = false
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
      this: IDBObjectStore,
      ...args: Parameters<IDBObjectStore['put']>
    ) {
      if (this.name === 'snapshots' && !failed) {
        failed = true
        this.transaction.abort()
        throw Error('Injected transaction failure')
      }
      return originalPut.apply(this, args)
    })
    try {
      await expect(replaceSnapshots([{ ...snapshot, id: 'new-snapshot' }])).rejects.toThrow()
    } finally {
      vi.restoreAllMocks()
      database.close()
    }
    expect((await listSnapshots()).map((item) => item.id)).toEqual([snapshot.id])
    expect((await loadSnapshot(snapshot.id)).boards[0].objects[0]).toMatchObject({ src: image })
    expect((await loadArchiveSnapshots()).assets.size).toBe(1)
    await replaceSnapshots([])
  })
})
