import type { EditorTab } from "../types"

const dbName = "nowtpad"
const storeName = "draft-state"
const stateKey = "open-tabs"

type PersistedState = {
  tabs: EditorTab[]
  activeTabId: string | null
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1)

    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName)
      }
    }

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

export async function loadDraftState(): Promise<PersistedState | null> {
  const db = await openDb()

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly")
    const request = tx.objectStore(storeName).get(stateKey)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve((request.result as PersistedState | undefined) ?? null)
  })
}

export async function saveDraftState(state: PersistedState): Promise<void> {
  const serializableState: PersistedState = {
    activeTabId: state.activeTabId,
    tabs: state.tabs.map(({ fileHandle: _fileHandle, ...tab }) => tab),
  }
  const db = await openDb()

  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite")
    tx.objectStore(storeName).put(serializableState, stateKey)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => resolve()
  })
}
