import type { EditorLanguage, SupportedExtension } from "./lib/fileTypes"

export type EditorTab = {
  id: string
  name: string
  extension: SupportedExtension
  language: EditorLanguage
  content: string
  dirty: boolean
  fileHandle?: FileSystemFileHandle
  nativePath?: string
  restored?: boolean
}
