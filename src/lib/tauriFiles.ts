import { invoke, isTauri } from "@tauri-apps/api/core"
import { listen } from "@tauri-apps/api/event"
import { open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog"
import { writeTextFile } from "@tauri-apps/plugin-fs"
import { getFileType, isKnownBinaryName, type SupportedExtension } from "./fileTypes"

export type NativeOpenedFile = {
  path: string
  name: string
  content: string
}

export type NativeOpenResult = {
  files: NativeOpenedFile[]
  unsupported: string[]
}

export function isTauriApp(): boolean {
  return isTauri()
}

export async function takeInitialOpenPaths(): Promise<string[]> {
  return invoke<string[]>("take_initial_open_paths")
}

export async function listenForNativeOpenPaths(
  onPaths: (paths: string[]) => void,
): Promise<() => void> {
  return listen<string[]>("open-files", (event) => {
    onPaths(event.payload)
  })
}

export function fileNameFromPath(path: string): string {
  return path.split(/[\\/]/).pop() || path
}

export async function openNativeFiles(): Promise<NativeOpenResult> {
  const selected = await openDialog({
    multiple: true,
    fileAccessMode: "scoped",
  })

  if (!selected) return { files: [], unsupported: [] }

  const paths = Array.isArray(selected) ? selected : [selected]
  return openNativePaths(paths)
}

export async function openNativePaths(paths: string[]): Promise<NativeOpenResult> {
  const textPaths: string[] = []
  const unsupported = paths
    .map((path) => ({ path, name: fileNameFromPath(path) }))
    .filter(({ name }) => isKnownBinaryName(name))
    .map(({ name }) => name)

  for (const path of paths) {
    const name = fileNameFromPath(path)
    if (!isKnownBinaryName(name)) textPaths.push(path)
  }

  if (!textPaths.length) return { files: [], unsupported }

  const result = await invoke<NativeOpenResult>("read_native_paths", {
    paths: textPaths,
  })

  return {
    files: result.files,
    unsupported: [...unsupported, ...result.unsupported],
  }
}

export async function saveNativeFile(path: string, content: string): Promise<void> {
  await writeTextFile(path, content)
}

export async function revealNativeFile(path: string): Promise<void> {
  await invoke("reveal_native_file", { path })
}

export async function openNativeFileExternal(path: string): Promise<void> {
  await invoke("open_native_file_external", { path })
}

export async function saveNativeFileAs(
  suggestedName: string,
  extension: SupportedExtension,
  content: string,
): Promise<string | null> {
  const type = getFileType(extension)
  const path = await saveDialog({
    defaultPath: suggestedName,
    filters: [
      {
        name: type?.label ?? "Text",
        extensions: [extension],
      },
    ],
  })

  if (!path) return null

  await writeTextFile(path, content)
  return path
}
