import Editor from "@monaco-editor/react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import {
  Badge,
  Box,
  Button,
  Flex,
  HStack,
  IconButton,
  NativeSelect,
  Stack,
  Text,
} from "@chakra-ui/react";
import {
  Braces,
  CircleAlert,
  Code2,
  Download,
  FileText,
  FilePlus2,
  FolderOpen,
  HardDriveDownload,
  Maximize2,
  Minus,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getFileType,
  isKnownBinaryName,
  isReadableTextFile,
  languageOptions,
  supportedExtensions,
  withExtension,
  type SupportedExtension,
} from "./lib/fileTypes";
import { loadDraftState, saveDraftState } from "./lib/drafts";
import {
  fileNameFromPath,
  isTauriApp,
  listenForNativeOpenPaths,
  openNativeFiles,
  openNativePaths,
  saveNativeFile,
  saveNativeFileAs,
  takeInitialOpenPaths,
} from "./lib/tauriFiles";
import type { EditorTab } from "./types";
import {
  ColorModeButton,
  useColorMode,
  useColorModeValue,
} from "./components/ui/color-mode";

type Notice = {
  tone: "info" | "warning" | "error" | "success";
  message: string;
};

const filePickerTypes = [
  {
    description: "Supported text files",
    accept: {
      "text/plain": [".txt"],
      "text/html": [".html", ".htm"],
      "text/javascript": [".js", ".mjs", ".cjs"],
      "text/css": [".css"],
    },
  },
];

function isFileHandle(
  item: File | FileSystemFileHandle,
): item is FileSystemFileHandle {
  return "getFile" in item;
}

function createTab(
  name = "Untitled.txt",
  content = "",
  fileHandle?: FileSystemFileHandle,
  nativePath?: string,
): EditorTab {
  const type = getFileType(name);

  return {
    id: crypto.randomUUID(),
    name,
    extension: type.extension,
    language: type.language,
    content,
    dirty: Boolean(content),
    fileHandle,
    nativePath,
  };
}

function downloadFile(tab: EditorTab) {
  const type = getFileType(tab.extension);
  const blob = new Blob([tab.content], { type: `${type.mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = tab.name;
  link.click();
  URL.revokeObjectURL(url);
}

export function App() {
  const nativeApp = isTauriApp();
  const [tabs, setTabs] = useState<EditorTab[]>([createTab()]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const associatedOpenPathsRef = useRef(new Set<string>());
  const { colorMode } = useColorMode();
  const monacoTheme = useColorModeValue("vs", "vs-dark");
  const appBg = useColorModeValue("#ffffff", "#0f1115");
  const toolbarBg = useColorModeValue("#f8fafc", "#151821");
  const panelBg = useColorModeValue("#ffffff", "#111318");
  const tabStripBg = useColorModeValue("#f3f4f6", "#0f1117");
  const selectedTabBg = useColorModeValue("#ffffff", "#1b1f2a");
  const inactiveTabBg = useColorModeValue("#f8fafc", "#131720");
  const borderColor = useColorModeValue(
    "rgba(15, 23, 42, 0.12)",
    "rgba(255, 255, 255, 0.12)",
  );
  const mutedTextColor = useColorModeValue("#64748b", "#94a3b8");
  const selectedTabColor = useColorModeValue("#0f172a", "#f8fafc");
  const inactiveTabColor = useColorModeValue("#64748b", "#94a3b8");
  const fileIconBg = useColorModeValue(
    "rgba(15, 118, 110, 0.12)",
    "rgba(20, 184, 166, 0.16)",
  );
  const fileIconColor = useColorModeValue("#0f766e", "#5eead4");
  const dropPanelBg = useColorModeValue("#ffffff", "#151821");

  const activeTab = useMemo(
    () => tabs.find((tab) => tab.id === activeTabId) ?? tabs[0],
    [activeTabId, tabs],
  );

  const showNotice = useCallback((nextNotice: Notice) => {
    setNotice(nextNotice);
    window.setTimeout(() => setNotice(null), 4200);
  }, []);

  useEffect(() => {
    let mounted = true;
    loadDraftState()
      .then((state) => {
        if (!mounted || !state?.tabs.length) return;
        setTabs(state.tabs.map((tab) => ({ ...tab, restored: true })));
        setActiveTabId(state.activeTabId ?? state.tabs[0].id);
        showNotice({
          tone: "info",
          message: "Restored offline drafts from this device.",
        });
      })
      .catch(() => {
        showNotice({
          tone: "warning",
          message: "Draft restore is unavailable in this browser session.",
        });
      });

    return () => {
      mounted = false;
    };
  }, [showNotice]);

  useEffect(() => {
    if (!activeTabId && tabs[0]) {
      setActiveTabId(tabs[0].id);
    }
  }, [activeTabId, tabs]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      saveDraftState({ tabs, activeTabId }).catch(() => {
        setNotice({
          tone: "warning",
          message: "Could not persist offline drafts.",
        });
      });
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [activeTabId, tabs]);

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!nativeApp) return;
    void getCurrentWindow().setTheme(colorMode);
  }, [nativeApp, colorMode]);

  const openFiles = useCallback(
    async (items: Array<File | FileSystemFileHandle>) => {
      const nextTabs: EditorTab[] = [];
      const unsupported: string[] = [];

      for (const item of items) {
        const fileHandle = isFileHandle(item) ? item : undefined;
        const file = isFileHandle(item) ? await item.getFile() : item;
        if (!(await isReadableTextFile(file))) {
          unsupported.push(file.name);
          continue;
        }

        const type = getFileType(file.name);
        nextTabs.push(createTab(file.name, await file.text(), fileHandle));
      }

      if (nextTabs.length) {
        setTabs((current) => {
          const onlyBlank =
            current.length === 1 &&
            current[0].name === "Untitled.txt" &&
            current[0].content.length === 0 &&
            !current[0].dirty;
          return onlyBlank ? nextTabs : [...current, ...nextTabs];
        });
        setActiveTabId(nextTabs[0].id);
      }

      if (unsupported.length) {
        showNotice({
          tone: "error",
          message: `Unsupported binary file: ${unsupported.join(", ")}. Text/code files open as editable tabs.`,
        });
      }
    },
    [showNotice],
  );

  const addNativeFiles = useCallback(
    (files: Awaited<ReturnType<typeof openNativePaths>>["files"]) => {
      if (!files.length) return;

      const nextTabs = files.map((file) =>
        createTab(file.name, file.content, undefined, file.path),
      );
      setTabs((current) => {
        const onlyBlank =
          current.length === 1 &&
          current[0].name === "Untitled.txt" &&
          current[0].content.length === 0 &&
          !current[0].dirty;
        return onlyBlank ? nextTabs : [...current, ...nextTabs];
      });
      setActiveTabId(nextTabs[0].id);
    },
    [],
  );

  const showUnsupportedNativeFiles = useCallback(
    (unsupported: string[]) => {
      if (!unsupported.length) return;
      showNotice({
        tone: "error",
        message: `Unsupported binary file: ${unsupported.join(", ")}. Text/code files open as editable tabs.`,
      });
    },
    [showNotice],
  );

  const openNativeDroppedPaths = useCallback(
    async (paths: string[]) => {
      if (!paths.length) return;

      try {
        const { files, unsupported } = await openNativePaths(paths);
        addNativeFiles(files);
        showUnsupportedNativeFiles(unsupported);
      } catch {
        showNotice({
          tone: "error",
          message:
            "Could not open the dropped file. Binary files are not editable.",
        });
      }
    },
    [addNativeFiles, showNotice, showUnsupportedNativeFiles],
  );

  useEffect(() => {
    if (!nativeApp) return;

    let unlisten: (() => void) | undefined;
    void getCurrentWindow()
      .onDragDropEvent((event) => {
        if (event.payload.type === "enter" || event.payload.type === "over") {
          setIsDragging(true);
          return;
        }

        if (event.payload.type === "leave") {
          setIsDragging(false);
          return;
        }

        if (event.payload.type === "drop") {
          setIsDragging(false);
          void openNativeDroppedPaths(event.payload.paths);
        }
      })
      .then((nextUnlisten) => {
        unlisten = nextUnlisten;
      })
      .catch(() => {
        showNotice({
          tone: "warning",
          message: "Native file drag and drop is unavailable in this session.",
        });
      });

    return () => unlisten?.();
  }, [nativeApp, openNativeDroppedPaths, showNotice]);

  useEffect(() => {
    if (!nativeApp) return;

    const openAssociatedPaths = async (paths: string[]) => {
      const nextPaths = paths.filter((path) => {
        if (associatedOpenPathsRef.current.has(path)) return false;
        associatedOpenPathsRef.current.add(path);
        return true;
      });
      if (!nextPaths.length) return;

      try {
        const { files, unsupported } = await openNativePaths(nextPaths);
        addNativeFiles(files);
        showUnsupportedNativeFiles(unsupported);
      } catch {
        showNotice({
          tone: "error",
          message:
            "Could not open the requested file. Binary files are not editable.",
        });
      }
    };

    let unlisten: (() => void) | undefined;

    void listenForNativeOpenPaths((paths) => {
      void openAssociatedPaths(paths);
    })
      .then((nextUnlisten) => {
        unlisten = nextUnlisten;
        return takeInitialOpenPaths();
      })
      .then(openAssociatedPaths)
      .catch(() => {
        showNotice({
          tone: "warning",
          message: "Native file open events are unavailable in this session.",
        });
      });

    return () => unlisten?.();
  }, [addNativeFiles, nativeApp, showNotice, showUnsupportedNativeFiles]);

  const handleOpen = async () => {
    if (nativeApp) {
      try {
        const { files, unsupported } = await openNativeFiles();

        addNativeFiles(files);
        showUnsupportedNativeFiles(unsupported);
      } catch {
        showNotice({
          tone: "error",
          message:
            "Could not open the selected file. Binary files are not editable.",
        });
      }
      return;
    }

    if (window.showOpenFilePicker) {
      try {
        const handles = await window.showOpenFilePicker({
          multiple: true,
          types: filePickerTypes,
        });
        await openFiles(handles);
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        showNotice({
          tone: "error",
          message: "Could not open the selected file.",
        });
      }
      return;
    }

    fileInputRef.current?.click();
  };

  const handleInputFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    await openFiles(Array.from(files));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleWindowMinimize = () => {
    if (!nativeApp) return;
    void getCurrentWindow().minimize();
  };

  const handleWindowFullscreen = async () => {
    if (!nativeApp) return;
    const appWindow = getCurrentWindow();
    const isFullscreen = await appWindow.isFullscreen();
    await appWindow.setFullscreen(!isFullscreen);
  };

  const handleWindowClose = () => {
    if (!nativeApp) return;
    void getCurrentWindow().close();
  };

  const handleWindowDrag = (event: React.MouseEvent) => {
    if (!nativeApp || event.button !== 0 || event.detail > 1) return;
    void getCurrentWindow().startDragging();
  };

  const handleWindowHeaderDoubleClick = () => {
    if (!nativeApp) return;
    void handleWindowFullscreen();
  };

  const updateActiveTab = (patch: Partial<EditorTab>) => {
    if (!activeTab) return;
    setTabs((current) =>
      current.map((tab) =>
        tab.id === activeTab.id ? { ...tab, ...patch } : tab,
      ),
    );
  };

  const saveToHandle = async (tab: EditorTab, handle: FileSystemFileHandle) => {
    const writable = await handle.createWritable();
    await writable.write(tab.content);
    await writable.close();
  };

  const handleSave = async () => {
    if (!activeTab) return;

    if (nativeApp && activeTab.nativePath) {
      try {
        await saveNativeFile(activeTab.nativePath, activeTab.content);
        updateActiveTab({ dirty: false, restored: false });
        showNotice({ tone: "success", message: `Saved ${activeTab.name}.` });
      } catch {
        showNotice({
          tone: "error",
          message: "Could not save back to the original file.",
        });
      }
      return;
    }

    if (activeTab.fileHandle) {
      try {
        await saveToHandle(activeTab, activeTab.fileHandle);
        updateActiveTab({ dirty: false, restored: false });
        showNotice({ tone: "success", message: `Saved ${activeTab.name}.` });
      } catch {
        showNotice({
          tone: "error",
          message: "Could not save back to the original file.",
        });
      }
      return;
    }

    await handleSaveAs();
  };

  const handleSaveAs = async () => {
    if (!activeTab) return;

    if (nativeApp) {
      try {
        const path = await saveNativeFileAs(
          activeTab.name,
          activeTab.extension,
          activeTab.content,
        );
        if (!path) return;

        updateActiveTab({
          nativePath: path,
          name: fileNameFromPath(path),
          dirty: false,
          restored: false,
        });
        showNotice({
          tone: "success",
          message: `Saved ${fileNameFromPath(path)}.`,
        });
      } catch {
        showNotice({ tone: "error", message: "Could not save the file." });
      }
      return;
    }

    if (window.showSaveFilePicker) {
      try {
        const type = getFileType(activeTab.extension);
        const handle = await window.showSaveFilePicker({
          suggestedName: activeTab.name,
          types: [
            {
              description: type.label,
              accept: { [type.mime]: [`.${activeTab.extension}`] },
            },
          ],
        });
        await saveToHandle(activeTab, handle);
        updateActiveTab({
          fileHandle: handle,
          name: handle.name,
          dirty: false,
          restored: false,
        });
        showNotice({ tone: "success", message: `Saved ${handle.name}.` });
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError")
          return;
        showNotice({ tone: "error", message: "Could not save the file." });
      }
      return;
    }

    downloadFile(activeTab);
    updateActiveTab({ dirty: false });
    showNotice({
      tone: "info",
      message: "Downloaded a copy because direct save is not supported here.",
    });
  };

  const handleNewTab = () => {
    const tab = createTab();
    setTabs((current) => [...current, tab]);
    setActiveTabId(tab.id);
  };

  const handleCloseTab = (id: string) => {
    setTabs((current) => {
      if (current.length === 1) {
        const tab = createTab();
        setActiveTabId(tab.id);
        return [tab];
      }

      const closingIndex = current.findIndex((tab) => tab.id === id);
      const next = current.filter((tab) => tab.id !== id);
      if (activeTabId === id) {
        setActiveTabId(
          next[Math.max(0, closingIndex - 1)]?.id ?? next[0]?.id ?? null,
        );
      }
      return next;
    });
  };

  const handleLanguageChange = (extension: SupportedExtension) => {
    const type = getFileType(extension);
    if (!activeTab) return;
    updateActiveTab({
      extension: type.extension,
      language: type.language,
      name: withExtension(activeTab.name, type.extension),
      fileHandle: undefined,
      nativePath: undefined,
      dirty: true,
    });
  };

  const onDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    if (nativeApp && event.dataTransfer.files.length) return;

    const binaryDrops = Array.from(event.dataTransfer.files).filter((file) =>
      isKnownBinaryName(file.name),
    );
    if (binaryDrops.length) {
      showNotice({
        tone: "error",
        message: `Unsupported binary file: ${binaryDrops.map((file) => file.name).join(", ")}.`,
      });
    }
    await openFiles(Array.from(event.dataTransfer.files));
  };

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const command = event.metaKey || event.ctrlKey;
      if (!command) return;

      const key = event.key.toLowerCase();

      if (key === "o") {
        event.preventDefault();
        void handleOpen();
      }

      if (key === "s" && event.shiftKey) {
        event.preventDefault();
        void handleSaveAs();
      }

      if (key === "s" && !event.shiftKey) {
        event.preventDefault();
        void handleSave();
      }

      if (key === "n") {
        event.preventDefault();
        handleNewTab();
      }

      if (key === "w" && activeTab) {
        event.preventDefault();
        handleCloseTab(activeTab.id);
      }
    };

    window.addEventListener("keydown", handleShortcut, { capture: true });
    return () =>
      window.removeEventListener("keydown", handleShortcut, { capture: true });
  }, [activeTab, handleOpen, handleSave, handleSaveAs]);

  const noticeColor = {
    info: "var(--accent-strong)",
    warning: "#9a5b13",
    error: "#b42318",
    success: "var(--accent-strong)",
  }[notice?.tone ?? "info"];

  const activeFileType = activeTab ? getFileType(activeTab.extension) : null;
  const saveStatus = activeTab?.nativePath
    ? "Native file"
    : activeTab?.fileHandle
      ? "Browser file"
      : "Local draft";
  const dirtyCount = tabs.filter((tab) => tab.dirty).length;

  return (
    <Flex
      h="100%"
      direction="column"
      bg={appBg}
      color={selectedTabColor}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setIsDragging(false);
      }}
      onDrop={onDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={supportedExtensions.join(",")}
        hidden
        onChange={(event) => void handleInputFiles(event.target.files)}
      />

      <Flex
        as="header"
        align={{ base: "stretch", lg: "center" }}
        justify="space-between"
        direction="row"
        px={2}
        bg={toolbarBg}
        borderBottom="1px solid"
        borderBottomColor={borderColor}
        onMouseDown={handleWindowDrag}
        onDoubleClick={handleWindowHeaderDoubleClick}
      >
        <HStack gap={2} minW={0}>
          {nativeApp && (
            <HStack gap={2} onMouseDown={(event) => event.stopPropagation()}>
              <IconButton
                display="grid"
                placeItems="center"
                unstyled
                boxSize="14px"
                aria-label="Close window"
                rounded="full"
                bg="#ff5f57"
                color="transparent"
                _hover={{ bg: "#ff5f57", color: "#5f1111" }}
                onClick={handleWindowClose}
              >
                <X size={8} />
              </IconButton>
              <IconButton
                display="grid"
                placeItems="center"
                unstyled
                boxSize="14px"
                aria-label="Minimize window"
                size="xs"
                rounded="full"
                bg="#ffbd2e"
                color="transparent"
                _hover={{ bg: "#ffbd2e", color: "#6b4500" }}
                onClick={handleWindowMinimize}
              >
                <Minus size={8} />
              </IconButton>
              <IconButton
                display="grid"
                placeItems="center"
                unstyled
                boxSize="14px"
                aria-label="Toggle fullscreen"
                rounded="full"
                bg="#28c840"
                color="transparent"
                _hover={{ bg: "#28c840", color: "#0b5c1a" }}
                onClick={() => void handleWindowFullscreen()}
              >
                <Maximize2 size={7} />
              </IconButton>
            </HStack>
          )}
          <Stack gap={0} minW={0}>
            <Text as="h1" lineHeight="1.15" fontWeight="semibold">
              nowtpad by bok
            </Text>
          </Stack>
        </HStack>

        <HStack
          gap={0}
          wrap="wrap"
          justify={{ base: "flex-start", lg: "flex-end" }}
          maxW="100%"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <Button
            rounded={0}
            size="xs"
            aria-label="Open file"
            onClick={handleOpen}
            fontSize="xs"
          >
            <FolderOpen size={6} />
            Open
          </Button>
          <Button
            rounded={0}
            size="xs"
            variant="subtle"
            aria-label="New tab"
            onClick={handleNewTab}
            fontSize="xs"
          >
            <FilePlus2 size={6} />
            New
          </Button>
          <Button
            aria-label="Save file"
            rounded={0}
            size="xs"
            variant="subtle"
            onClick={handleSave}
            disabled={!activeTab}
            fontSize="xs"
          >
            <Save size={6} />
            Save
          </Button>
          <Button
            aria-label="Save as"
            rounded={0}
            size="xs"
            variant="subtle"
            onClick={handleSaveAs}
            disabled={!activeTab}
            fontSize="xs"
          >
            <Download size={6} />
            Save As
          </Button>
        </HStack>
      </Flex>

      {notice && (
        <HStack role="alert" gap={2.5} p={2} bg="bg.warning">
          <CircleAlert size={17} />
          <Text fontSize="sm" fontWeight="620">
            {notice.message}
          </Text>
        </HStack>
      )}

      <Flex
        borderBottom="1px solid"
        borderBottomColor={borderColor}
        align="center"
        gap={0}
        overflowX="auto"
        bg={tabStripBg}
      >
        {tabs.map((tab) => {
          const selected = activeTab?.id === tab.id;
          const tabType = getFileType(tab.extension);
          return (
            <HStack
              cursor="pointer"
              key={tab.id}
              as="button"
              onClick={() => setActiveTabId(tab.id)}
              align="center"
              gap={2}
              minW="168px"
              maxW="260px"
              h="38px"
              px={2}
              // border="1px solid"
              // borderColor={selected ? "var(--line)" : "transparent"}
              borderRight="1px solid"
              borderRightColor={borderColor}
              bg={selected ? selectedTabBg : inactiveTabBg}
              color={selected ? selectedTabColor : inactiveTabColor}
            >
              <Flex
                align="center"
                justify="center"
                w="22px"
                h="22px"
                flex="0 0 auto"
                borderRadius="5px"
                bg={fileIconBg}
                color={fileIconColor}
              >
                <FileText size={13} />
              </Flex>

              <Stack gap={0} minW={0} flex="1" align="stretch">
                <Text
                  fontSize="xs"
                  fontWeight={selected ? "semibold" : "regular"}
                  lineHeight="1.15"
                  truncate
                  textAlign="left"
                >
                  {tab.dirty ? "• " : ""}
                  {tab.name}
                </Text>
                <Text
                  fontSize="10px"
                  lineHeight="1.1"
                  color={mutedTextColor}
                  truncate
                  textAlign="left"
                >
                  {tabType.label}
                </Text>
              </Stack>

              <IconButton
                aria-label={`Close ${tab.name}`}
                size="xs"
                variant="ghost"
                minW="26px"
                h="26px"
                borderRadius="6px"
                color={mutedTextColor}
                _hover={{ bg: fileIconBg, color: selectedTabColor }}
                onClick={(event) => {
                  event.stopPropagation();
                  handleCloseTab(tab.id);
                }}
              >
                <X size={14} />
              </IconButton>
            </HStack>
          );
        })}
      </Flex>

      <Box flex="1" minH={0} position="relative">
        <Box h="100%" overflow="hidden" bg={panelBg}>
          {activeTab && (
            <Editor
              key={activeTab.id}
              height="100%"
              language={activeTab.language}
              value={activeTab.content}
              theme={monacoTheme}
              options={{
                automaticLayout: true,
                fontFamily:
                  "SFMono-Regular, Menlo, Monaco, Consolas, Liberation Mono, monospace",
                fontSize: 14,
                lineHeight: 21,
                insertSpaces: true,
                tabSize: getFileType(activeTab.extension)?.tabSize ?? 2,
                folding: false,
                glyphMargin: false,
                lineDecorationsWidth: 8,
                minimap: { enabled: false },
                lineNumbers: "on",
                lineNumbersMinChars: 4,
                wordWrap: "on",
                scrollBeyondLastLine: false,
                formatOnPaste: activeTab.language !== "plaintext",
                formatOnType: activeTab.language !== "plaintext",
                padding: { top: 0, bottom: 0 },
              }}
              onChange={(value) => {
                updateActiveTab({ content: value ?? "", dirty: true });
              }}
            />
          )}
        </Box>

        {isDragging && (
          <Flex
            position="absolute"
            inset={{ base: 2, md: 4 }}
            align="center"
            justify="center"
            bg="rgba(15, 118, 110, 0.16)"
            border="1px dashed rgba(15, 118, 110, 0.72)"
            borderRadius="10px"
            pointerEvents="none"
          >
            <HStack
              gap={2.5}
              px={4}
              py={3}
              bg={dropPanelBg}
              borderRadius="9px"
              boxShadow="var(--shadow-soft)"
            >
              <Sparkles size={17} color="var(--accent-strong)" />
              <Text fontWeight="700" color="var(--accent-strong)">
                Drop text or code files to open them
              </Text>
            </HStack>
          </Flex>
        )}
      </Box>

      <Flex
        as="footer"
        align="center"
        justify="space-between"
        gap={3}
        minH="34px"
        borderTop="1px solid"
        borderTopColor={borderColor}
        bg={toolbarBg}
        px={4}
        pt={0}
      >
        <HStack
          gap={1}
          flex="1 1 auto"
          minW={0}
          overflow="hidden"
          wrap="nowrap"
        >
          <Badge colorPalette={online ? "green" : "red"}>
            {online ? "Online" : "Offline"}
          </Badge>
          <Badge>
            {tabs.length} tab{tabs.length === 1 ? "" : "s"}
          </Badge>
          <Badge>{dirtyCount} unsaved</Badge>
          <Badge>
            <HardDriveDownload size={8} />
            {activeTab?.nativePath
              ? activeTab.nativePath
              : activeTab?.fileHandle
                ? "Saving to original browser file"
                : "Autosaved as a local draft"}
          </Badge>
        </HStack>

        {activeTab && (
          <HStack gap={0} flex="0 1 auto" minW={0}>
            <NativeSelect.Root size="xs" variant="subtle">
              <NativeSelect.Field
                rounded={0}
                value={activeTab.extension}
                onChange={(event) =>
                  handleLanguageChange(event.target.value as SupportedExtension)
                }
              >
                {languageOptions.map((option) => (
                  <option key={option.extension} value={option.extension}>
                    {option.label} .{option.extension}
                  </option>
                ))}
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
            <ColorModeButton size="xs" variant="solid" rounded={0} p={0} />
          </HStack>
        )}
      </Flex>
    </Flex>
  );
}
