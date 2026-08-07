/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface FileSystemWritableFileStream extends WritableStream {
  write(data: BlobPart): Promise<void>
  close(): Promise<void>
}

interface FileSystemFileHandle {
  kind: "file"
  name: string
  getFile(): Promise<File>
  createWritable(): Promise<FileSystemWritableFileStream>
}

interface Window {
  showOpenFilePicker?: (options?: {
    multiple?: boolean
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle[]>
  showSaveFilePicker?: (options?: {
    suggestedName?: string
    types?: Array<{
      description: string
      accept: Record<string, string[]>
    }>
  }) => Promise<FileSystemFileHandle>
}
