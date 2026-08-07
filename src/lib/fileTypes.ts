export type SupportedExtension = string

export type EditorLanguage =
  | "plaintext"
  | "abap"
  | "apex"
  | "azcli"
  | "bat"
  | "bicep"
  | "cameligo"
  | "clojure"
  | "coffee"
  | "cpp"
  | "csharp"
  | "csp"
  | "css"
  | "cypher"
  | "dart"
  | "dockerfile"
  | "ecl"
  | "elixir"
  | "flow9"
  | "fsharp"
  | "freemarker2"
  | "go"
  | "graphql"
  | "handlebars"
  | "hcl"
  | "html"
  | "ini"
  | "java"
  | "javascript"
  | "json"
  | "julia"
  | "kotlin"
  | "less"
  | "lexon"
  | "lua"
  | "liquid"
  | "m3"
  | "markdown"
  | "mdx"
  | "mips"
  | "msdax"
  | "mysql"
  | "objective-c"
  | "pascal"
  | "pascaligo"
  | "perl"
  | "pgsql"
  | "php"
  | "pla"
  | "postiats"
  | "powerquery"
  | "powershell"
  | "proto"
  | "pug"
  | "python"
  | "qsharp"
  | "r"
  | "razor"
  | "redis"
  | "redshift"
  | "restructuredtext"
  | "ruby"
  | "rust"
  | "sb"
  | "scala"
  | "scheme"
  | "scss"
  | "shell"
  | "solidity"
  | "sophia"
  | "sparql"
  | "sql"
  | "st"
  | "swift"
  | "systemverilog"
  | "tcl"
  | "twig"
  | "typescript"
  | "typespec"
  | "vb"
  | "wgsl"
  | "xml"
  | "yaml"

export type FileType = {
  extension: SupportedExtension
  language: EditorLanguage
  label: string
  mime: string
  tabSize: number
  known: boolean
}

const languageByExtension: Record<string, Omit<FileType, "extension" | "known">> = {
  abap: { language: "abap", label: "ABAP", mime: "text/plain", tabSize: 2 },
  apex: { language: "apex", label: "Apex", mime: "text/plain", tabSize: 2 },
  bat: { language: "bat", label: "Batch", mime: "text/plain", tabSize: 2 },
  bicep: { language: "bicep", label: "Bicep", mime: "text/plain", tabSize: 2 },
  c: { language: "cpp", label: "C", mime: "text/x-c", tabSize: 2 },
  cc: { language: "cpp", label: "C++", mime: "text/x-c++", tabSize: 2 },
  clj: { language: "clojure", label: "Clojure", mime: "text/plain", tabSize: 2 },
  cljs: { language: "clojure", label: "ClojureScript", mime: "text/plain", tabSize: 2 },
  coffee: { language: "coffee", label: "CoffeeScript", mime: "text/plain", tabSize: 2 },
  cpp: { language: "cpp", label: "C++", mime: "text/x-c++", tabSize: 2 },
  cs: { language: "csharp", label: "C#", mime: "text/plain", tabSize: 4 },
  css: { language: "css", label: "CSS", mime: "text/css", tabSize: 2 },
  csv: { language: "plaintext", label: "CSV", mime: "text/csv", tabSize: 2 },
  dart: { language: "dart", label: "Dart", mime: "text/plain", tabSize: 2 },
  diff: { language: "plaintext", label: "Diff", mime: "text/plain", tabSize: 2 },
  dockerfile: { language: "dockerfile", label: "Dockerfile", mime: "text/plain", tabSize: 2 },
  env: { language: "ini", label: "Environment", mime: "text/plain", tabSize: 2 },
  ex: { language: "elixir", label: "Elixir", mime: "text/plain", tabSize: 2 },
  exs: { language: "elixir", label: "Elixir", mime: "text/plain", tabSize: 2 },
  fs: { language: "fsharp", label: "F#", mime: "text/plain", tabSize: 4 },
  fsi: { language: "fsharp", label: "F#", mime: "text/plain", tabSize: 4 },
  fsx: { language: "fsharp", label: "F#", mime: "text/plain", tabSize: 4 },
  go: { language: "go", label: "Go", mime: "text/plain", tabSize: 4 },
  gql: { language: "graphql", label: "GraphQL", mime: "text/plain", tabSize: 2 },
  graphql: { language: "graphql", label: "GraphQL", mime: "text/plain", tabSize: 2 },
  h: { language: "cpp", label: "C Header", mime: "text/x-c", tabSize: 2 },
  handlebars: { language: "handlebars", label: "Handlebars", mime: "text/plain", tabSize: 2 },
  hbs: { language: "handlebars", label: "Handlebars", mime: "text/plain", tabSize: 2 },
  hcl: { language: "hcl", label: "HCL", mime: "text/plain", tabSize: 2 },
  hpp: { language: "cpp", label: "C++ Header", mime: "text/x-c++", tabSize: 2 },
  htm: { language: "html", label: "HTML", mime: "text/html", tabSize: 2 },
  html: { language: "html", label: "HTML", mime: "text/html", tabSize: 2 },
  ini: { language: "ini", label: "INI", mime: "text/plain", tabSize: 2 },
  java: { language: "java", label: "Java", mime: "text/x-java-source", tabSize: 4 },
  js: { language: "javascript", label: "JavaScript", mime: "text/javascript", tabSize: 2 },
  json: { language: "json", label: "JSON", mime: "application/json", tabSize: 2 },
  jsonc: { language: "json", label: "JSON with Comments", mime: "application/json", tabSize: 2 },
  jsx: { language: "javascript", label: "JavaScript JSX", mime: "text/javascript", tabSize: 2 },
  kt: { language: "kotlin", label: "Kotlin", mime: "text/plain", tabSize: 4 },
  kts: { language: "kotlin", label: "Kotlin Script", mime: "text/plain", tabSize: 4 },
  less: { language: "less", label: "Less", mime: "text/css", tabSize: 2 },
  liquid: { language: "liquid", label: "Liquid", mime: "text/plain", tabSize: 2 },
  lua: { language: "lua", label: "Lua", mime: "text/plain", tabSize: 2 },
  m: { language: "objective-c", label: "Objective-C", mime: "text/plain", tabSize: 2 },
  md: { language: "markdown", label: "Markdown", mime: "text/markdown", tabSize: 2 },
  mdx: { language: "mdx", label: "MDX", mime: "text/markdown", tabSize: 2 },
  mjs: { language: "javascript", label: "JavaScript Module", mime: "text/javascript", tabSize: 2 },
  mm: { language: "objective-c", label: "Objective-C++", mime: "text/plain", tabSize: 2 },
  php: { language: "php", label: "PHP", mime: "text/x-php", tabSize: 4 },
  pl: { language: "perl", label: "Perl", mime: "text/plain", tabSize: 2 },
  pm: { language: "perl", label: "Perl", mime: "text/plain", tabSize: 2 },
  ps1: { language: "powershell", label: "PowerShell", mime: "text/plain", tabSize: 2 },
  pug: { language: "pug", label: "Pug", mime: "text/plain", tabSize: 2 },
  py: { language: "python", label: "Python", mime: "text/x-python", tabSize: 4 },
  r: { language: "r", label: "R", mime: "text/plain", tabSize: 2 },
  rb: { language: "ruby", label: "Ruby", mime: "text/plain", tabSize: 2 },
  rs: { language: "rust", label: "Rust", mime: "text/plain", tabSize: 4 },
  sass: { language: "scss", label: "Sass", mime: "text/css", tabSize: 2 },
  scala: { language: "scala", label: "Scala", mime: "text/plain", tabSize: 2 },
  scss: { language: "scss", label: "SCSS", mime: "text/css", tabSize: 2 },
  sh: { language: "shell", label: "Shell", mime: "text/x-shellscript", tabSize: 2 },
  sol: { language: "solidity", label: "Solidity", mime: "text/plain", tabSize: 2 },
  sql: { language: "sql", label: "SQL", mime: "application/sql", tabSize: 2 },
  swift: { language: "swift", label: "Swift", mime: "text/plain", tabSize: 2 },
  tcl: { language: "tcl", label: "Tcl", mime: "text/plain", tabSize: 2 },
  toml: { language: "ini", label: "TOML", mime: "text/plain", tabSize: 2 },
  ts: { language: "typescript", label: "TypeScript", mime: "text/typescript", tabSize: 2 },
  tsx: { language: "typescript", label: "TypeScript TSX", mime: "text/typescript", tabSize: 2 },
  twig: { language: "twig", label: "Twig", mime: "text/plain", tabSize: 2 },
  txt: { language: "plaintext", label: "Text", mime: "text/plain", tabSize: 2 },
  vb: { language: "vb", label: "Visual Basic", mime: "text/plain", tabSize: 4 },
  vue: { language: "html", label: "Vue", mime: "text/html", tabSize: 2 },
  wgsl: { language: "wgsl", label: "WGSL", mime: "text/plain", tabSize: 2 },
  xml: { language: "xml", label: "XML", mime: "application/xml", tabSize: 2 },
  yaml: { language: "yaml", label: "YAML", mime: "application/yaml", tabSize: 2 },
  yml: { language: "yaml", label: "YAML", mime: "application/yaml", tabSize: 2 },
  zig: { language: "plaintext", label: "Zig", mime: "text/plain", tabSize: 4 },
}

const nameTypes: Record<string, Omit<FileType, "extension" | "known">> = {
  ".bash_profile": { language: "shell", label: "Shell", mime: "text/x-shellscript", tabSize: 2 },
  ".bashrc": { language: "shell", label: "Shell", mime: "text/x-shellscript", tabSize: 2 },
  ".env": { language: "ini", label: "Environment", mime: "text/plain", tabSize: 2 },
  ".gitignore": { language: "plaintext", label: "Git Ignore", mime: "text/plain", tabSize: 2 },
  ".npmrc": { language: "ini", label: "NPM Config", mime: "text/plain", tabSize: 2 },
  ".zprofile": { language: "shell", label: "Shell", mime: "text/x-shellscript", tabSize: 2 },
  ".zshrc": { language: "shell", label: "Shell", mime: "text/x-shellscript", tabSize: 2 },
  dockerfile: { language: "dockerfile", label: "Dockerfile", mime: "text/plain", tabSize: 2 },
  makefile: { language: "plaintext", label: "Makefile", mime: "text/plain", tabSize: 4 },
}

const binaryExtensions = new Set([
  "7z",
  "a",
  "app",
  "avi",
  "bin",
  "bmp",
  "bz2",
  "class",
  "dmg",
  "doc",
  "docx",
  "dylib",
  "eot",
  "exe",
  "gif",
  "gz",
  "heic",
  "ico",
  "icns",
  "jar",
  "jpeg",
  "jpg",
  "lockb",
  "mov",
  "mp3",
  "mp4",
  "o",
  "otf",
  "pdf",
  "png",
  "ppt",
  "pptx",
  "pyc",
  "rar",
  "so",
  "sqlite",
  "sqlite3",
  "tar",
  "tif",
  "tiff",
  "ttf",
  "wasm",
  "webm",
  "webp",
  "woff",
  "woff2",
  "xls",
  "xlsx",
  "zip",
])

export const languageOptions: FileType[] = [
  toKnownType("txt"),
  toKnownType("md"),
  toKnownType("html"),
  toKnownType("css"),
  toKnownType("js"),
  toKnownType("ts"),
  toKnownType("json"),
  toKnownType("py"),
  toKnownType("sh"),
  toKnownType("yaml"),
]

export const supportedExtensions = Object.keys(languageByExtension).map((extension) => `.${extension}`)

function toKnownType(extension: string): FileType {
  const type = languageByExtension[extension]
  return { ...type, extension, known: true }
}

export function getExtension(name: string): string {
  const lastSegment = name.split(/[\\/]/).pop() ?? name
  const lastDot = lastSegment.lastIndexOf(".")
  return lastDot > 0 ? lastSegment.slice(lastDot + 1).toLowerCase() : ""
}

export function getFileType(nameOrExtension: string): FileType {
  const normalized = nameOrExtension.trim().toLowerCase()
  const baseName = normalized.split(/[\\/]/).pop() ?? normalized
  const namedType = nameTypes[baseName]
  if (namedType) {
    return { ...namedType, extension: getExtension(baseName) || "txt", known: true }
  }

  const extension = normalized.startsWith(".")
    ? normalized.slice(1)
    : normalized.includes(".")
      ? getExtension(normalized)
      : normalized

  const type = languageByExtension[extension]
  if (type) return { ...type, extension, known: true }

  return {
    extension: extension || "txt",
    language: "plaintext",
    label: extension ? `${extension.toUpperCase()} Text` : "Plain Text",
    mime: "text/plain",
    tabSize: 2,
    known: false,
  }
}

export function withExtension(name: string, extension: SupportedExtension): string {
  const base = name.includes(".") ? name.slice(0, name.lastIndexOf(".")) : name
  return `${base || "Untitled"}.${extension}`
}

export function isKnownBinaryName(name: string): boolean {
  const extension = getExtension(name)
  return Boolean(extension && binaryExtensions.has(extension))
}

export function isTextMime(mime: string): boolean {
  return (
    mime.startsWith("text/") ||
    mime.includes("json") ||
    mime.includes("xml") ||
    mime.includes("javascript") ||
    mime.includes("typescript") ||
    mime.includes("yaml")
  )
}

export function hasBinaryBytes(bytes: Uint8Array): boolean {
  const sample = bytes.slice(0, Math.min(bytes.length, 4096))
  if (sample.includes(0)) return true

  let suspiciousControlBytes = 0
  for (const byte of sample) {
    const isAllowedControl = byte === 7 || byte === 8 || byte === 9 || byte === 10 || byte === 12 || byte === 13
    if (byte < 32 && !isAllowedControl) suspiciousControlBytes += 1
  }

  return sample.length > 0 && suspiciousControlBytes / sample.length > 0.3
}

export async function isReadableTextFile(file: File): Promise<boolean> {
  if (isKnownBinaryName(file.name)) return false
  if (file.type && isTextMime(file.type)) return true

  const sample = new Uint8Array(await file.slice(0, 4096).arrayBuffer())
  return !hasBinaryBytes(sample)
}
