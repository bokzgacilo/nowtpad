import Editor from "@monaco-editor/react";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
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
  ExternalLink,
  FileText,
  FilePlus2,
  FolderOpen,
  FolderSearch,
  HardDriveDownload,
  Maximize2,
  Minus,
  PanelLeft,
  PanelTop,
  Save,
  Settings,
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
  openNativeFileExternal,
  openNativePaths,
  revealNativeFile,
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

type NavigationLayout = "tabs" | "sidenav";

type TabContextMenu = {
  tabId: string;
  x: number;
  y: number;
};

type SettingsTab = "editor" | "general";

type UpdateStatus =
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "ready"
  | "error";

const minSideNavWidth = 190;
const maxSideNavWidth = 420;

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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function getTabLocationLabel(tab: EditorTab): string {
  if (tab.nativePath) return tab.nativePath;
  if (tab.fileHandle) return "Browser file";
  return "Local draft";
}

export function App() {
  const nativeApp = isTauriApp();
  const [tabs, setTabs] = useState<EditorTab[]>([createTab()]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [navigationLayout, setNavigationLayout] =
    useState<NavigationLayout>("tabs");
  const [tabContextMenu, setTabContextMenu] =
    useState<TabContextMenu | null>(null);
  const [sideNavWidth, setSideNavWidth] = useState(240);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>("editor");
  const [showMinimap, setShowMinimap] = useState(true);
  const [enableFolding, setEnableFolding] = useState(true);
  const [wordWrap, setWordWrap] = useState(true);
  const [pendingUpdate, setPendingUpdate] = useState<Update | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [updateDismissed, setUpdateDismissed] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateDownloadProgress, setUpdateDownloadProgress] = useState<
    string | null
  >(null);
  const [online, setOnline] = useState(navigator.onLine);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const associatedOpenPathsRef = useRef(new Set<string>());
  const autoUpdateCheckStartedRef = useRef(false);
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

  const checkForAppUpdate = useCallback(
    async (manual = false) => {
      if (!nativeApp) {
        if (manual) {
          showNotice({
            tone: "info",
            message: "App updates are only available in the desktop app.",
          });
        }
        return;
      }

      if (!navigator.onLine) {
        if (manual) {
          showNotice({
            tone: "warning",
            message: "Connect to the internet to check for updates.",
          });
        }
        return;
      }

      setUpdateStatus("checking");
      setUpdateError(null);
      setUpdateDownloadProgress(null);
      if (manual) setUpdateDismissed(false);

      try {
        const update = await check();
        if (!update) {
          setPendingUpdate(null);
          setUpdateStatus("idle");
          if (manual) {
            showNotice({
              tone: "success",
              message: "nowtpad is up to date.",
            });
          }
          return;
        }

        setPendingUpdate(update);
        setUpdateStatus("available");
        setUpdateDismissed(false);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Update check failed. Confirm the updater key and endpoint are configured.";
        setPendingUpdate(null);
        setUpdateStatus("error");
        setUpdateError(message);
        if (manual) {
          showNotice({ tone: "error", message });
        }
      }
    },
    [nativeApp, showNotice],
  );

  const handleInstallUpdate = async () => {
    if (!pendingUpdate) return;

    try {
      setUpdateStatus("downloading");
      setUpdateError(null);
      setUpdateDownloadProgress("Starting download...");

      let downloaded = 0;
      let contentLength = 0;
      await pendingUpdate.downloadAndInstall((event) => {
        if (event.event === "Started") {
          downloaded = 0;
          contentLength = event.data.contentLength ?? 0;
          setUpdateDownloadProgress(
            contentLength
              ? `Downloading 0 of ${Math.round(contentLength / 1024 / 1024)} MB`
              : "Downloading update...",
          );
        }

        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          setUpdateDownloadProgress(
            contentLength
              ? `Downloading ${Math.round(downloaded / 1024 / 1024)} of ${Math.round(contentLength / 1024 / 1024)} MB`
              : "Downloading update...",
          );
        }

        if (event.event === "Finished") {
          setUpdateDownloadProgress("Installing update...");
        }
      });

      setUpdateStatus("ready");
      setUpdateDownloadProgress("Restarting nowtpad...");
      await relaunch();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Could not download and install the update.";
      setUpdateStatus("error");
      setUpdateError(message);
      setUpdateDownloadProgress(null);
    }
  };

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
    if (!nativeApp || !online || autoUpdateCheckStartedRef.current) return;
    autoUpdateCheckStartedRef.current = true;
    void checkForAppUpdate();
  }, [checkForAppUpdate, nativeApp, online]);

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
    updateTab(activeTab.id, patch);
  };

  const updateTab = (id: string, patch: Partial<EditorTab>) => {
    setTabs((current) =>
      current.map((tab) =>
        tab.id === id ? { ...tab, ...patch } : tab,
      ),
    );
  };

  const saveToHandle = async (tab: EditorTab, handle: FileSystemFileHandle) => {
    const writable = await handle.createWritable();
    await writable.write(tab.content);
    await writable.close();
  };

  const handleSave = async (tab = activeTab) => {
    if (!tab) return;

    if (nativeApp && tab.nativePath) {
      try {
        await saveNativeFile(tab.nativePath, tab.content);
        updateTab(tab.id, { dirty: false, restored: false });
        showNotice({ tone: "success", message: `Saved ${tab.name}.` });
      } catch {
        showNotice({
          tone: "error",
          message: "Could not save back to the original file.",
        });
      }
      return;
    }

    if (tab.fileHandle) {
      try {
        await saveToHandle(tab, tab.fileHandle);
        updateTab(tab.id, { dirty: false, restored: false });
        showNotice({ tone: "success", message: `Saved ${tab.name}.` });
      } catch {
        showNotice({
          tone: "error",
          message: "Could not save back to the original file.",
        });
      }
      return;
    }

    await handleSaveAs(tab);
  };

  const handleSaveAs = async (tab = activeTab) => {
    if (!tab) return;

    if (nativeApp) {
      try {
        const path = await saveNativeFileAs(
          tab.name,
          tab.extension,
          tab.content,
        );
        if (!path) return;

        updateTab(tab.id, {
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
        const type = getFileType(tab.extension);
        const handle = await window.showSaveFilePicker({
          suggestedName: tab.name,
          types: [
            {
              description: type.label,
              accept: { [type.mime]: [`.${tab.extension}`] },
            },
          ],
        });
        await saveToHandle(tab, handle);
        updateTab(tab.id, {
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

    downloadFile(tab);
    updateTab(tab.id, { dirty: false });
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
    setTabContextMenu(null);
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

  const handleTabContextMenu = (
    event: React.MouseEvent,
    tab: EditorTab,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setActiveTabId(tab.id);
    setTabContextMenu({
      tabId: tab.id,
      x: Math.min(event.clientX, window.innerWidth - 210),
      y: Math.min(event.clientY, window.innerHeight - 190),
    });
  };

  const handleRevealTabFile = async (tab: EditorTab) => {
    setTabContextMenu(null);
    if (!nativeApp || !tab.nativePath) {
      showNotice({
        tone: "warning",
        message: "Only saved native files can be revealed in a folder.",
      });
      return;
    }

    try {
      await revealNativeFile(tab.nativePath);
    } catch {
      showNotice({
        tone: "error",
        message: "Could not reveal the file in its folder.",
      });
    }
  };

  const handleOpenTabFileExternal = async (tab: EditorTab) => {
    setTabContextMenu(null);
    if (!nativeApp || !tab.nativePath) {
      showNotice({
        tone: "warning",
        message: "Only saved native files can be opened in an external viewer.",
      });
      return;
    }

    try {
      await openNativeFileExternal(tab.nativePath);
    } catch {
      showNotice({
        tone: "error",
        message: "Could not open the file in an external viewer.",
      });
    }
  };

  const handleSideNavResizeStart = (event: React.PointerEvent) => {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = sideNavWidth;

    const handlePointerMove = (moveEvent: PointerEvent) => {
      setSideNavWidth(
        clamp(
          startWidth + moveEvent.clientX - startX,
          minSideNavWidth,
          maxSideNavWidth,
        ),
      );
    };

    const handlePointerUp = () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
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

  useEffect(() => {
    if (!tabContextMenu) return;

    const closeContextMenu = () => setTabContextMenu(null);
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeContextMenu();
    };

    window.addEventListener("click", closeContextMenu);
    window.addEventListener("contextmenu", closeContextMenu);
    window.addEventListener("scroll", closeContextMenu, true);
    window.addEventListener("resize", closeContextMenu);
    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("click", closeContextMenu);
      window.removeEventListener("contextmenu", closeContextMenu);
      window.removeEventListener("scroll", closeContextMenu, true);
      window.removeEventListener("resize", closeContextMenu);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [tabContextMenu]);

  useEffect(() => {
    if (!settingsOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSettingsOpen(false);
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [settingsOpen]);

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
  const isSideNav = navigationLayout === "sidenav";
  const nextNavigationLayout = isSideNav ? "tabs" : "sidenav";
  const contextMenuTab =
    tabs.find((tab) => tab.id === tabContextMenu?.tabId) ?? null;
  const updatePromptOpen =
    Boolean(pendingUpdate) && !updateDismissed && updateStatus !== "idle";

  const renderTabNavItem = (
    tab: EditorTab,
    orientation: "horizontal" | "vertical",
  ) => {
    const selected = activeTab?.id === tab.id;
    const vertical = orientation === "vertical";

    return (
      <HStack
        cursor="pointer"
        key={tab.id}
        as="button"
        onClick={() => setActiveTabId(tab.id)}
        onContextMenu={(event) => handleTabContextMenu(event, tab)}
        align="center"
        gap={2}
        w={vertical ? "100%" : undefined}
        minW={vertical ? 0 : "168px"}
        maxW={vertical ? "100%" : "260px"}
        h="38px"
        px={2}
        borderRight={vertical ? undefined : "1px solid"}
        borderRightColor={vertical ? undefined : borderColor}
        borderBottom={vertical ? "1px solid" : undefined}
        borderBottomColor={vertical ? borderColor : undefined}
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
            {getTabLocationLabel(tab)}
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
  };

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
            onClick={() => void handleSave()}
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
            onClick={() => void handleSaveAs()}
            disabled={!activeTab}
            fontSize="xs"
          >
            <Download size={6} />
            Save As
          </Button>
          <IconButton
            aria-label={`Switch to ${isSideNav ? "horizontal tabs" : "side navigation"}`}
            aria-pressed={isSideNav}
            title={`Switch to ${isSideNav ? "horizontal tabs" : "side navigation"}`}
            rounded={0}
            size="xs"
            variant="subtle"
            onClick={() => setNavigationLayout(nextNavigationLayout)}
          >
            {isSideNav ? <PanelTop size={13} /> : <PanelLeft size={13} />}
          </IconButton>
          <IconButton
            aria-label="Open settings"
            title="Open settings"
            rounded={0}
            size="xs"
            variant="subtle"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={13} />
          </IconButton>
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

      {updatePromptOpen && pendingUpdate && (
        <Flex
          position="fixed"
          inset={0}
          zIndex={40}
          align="center"
          justify="center"
          bg="rgba(15, 23, 42, 0.34)"
          p={4}
        >
          <Box
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="update-title"
            w="min(440px, 100%)"
            bg={panelBg}
            color={selectedTabColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="8px"
            boxShadow="var(--shadow-soft)"
            overflow="hidden"
          >
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              px={3}
              py={2}
              borderBottom="1px solid"
              borderBottomColor={borderColor}
            >
              <HStack gap={2} minW={0}>
                <Sparkles size={15} color="var(--accent-strong)" />
                <Text id="update-title" fontSize="sm" fontWeight="700">
                  Update available
                </Text>
              </HStack>
              {updateStatus !== "downloading" && (
                <IconButton
                  aria-label="Dismiss update"
                  size="xs"
                  variant="ghost"
                  rounded="5px"
                  onClick={() => setUpdateDismissed(true)}
                >
                  <X size={14} />
                </IconButton>
              )}
            </Flex>

            <Stack gap={3} p={3}>
              <Stack gap={1}>
                <Text fontSize="sm" fontWeight="650">
                  nowtpad {pendingUpdate.version} is ready to install.
                </Text>
                <Text fontSize="xs" color={mutedTextColor}>
                  Current version: {pendingUpdate.currentVersion}
                </Text>
                {pendingUpdate.body && (
                  <Text fontSize="xs" color={mutedTextColor}>
                    {pendingUpdate.body}
                  </Text>
                )}
              </Stack>

              {updateDownloadProgress && (
                <Text fontSize="xs" color={mutedTextColor}>
                  {updateDownloadProgress}
                </Text>
              )}

              {updateStatus === "error" && updateError && (
                <Text fontSize="xs" color="#b42318">
                  {updateError}
                </Text>
              )}

              <HStack justify="flex-end" gap={2}>
                <Button
                  size="xs"
                  variant="ghost"
                  rounded="5px"
                  disabled={updateStatus === "downloading"}
                  onClick={() => setUpdateDismissed(true)}
                >
                  Later
                </Button>
                <Button
                  size="xs"
                  rounded="5px"
                  disabled={
                    updateStatus === "checking" ||
                    updateStatus === "downloading" ||
                    updateStatus === "ready"
                  }
                  onClick={() => void handleInstallUpdate()}
                >
                  {updateStatus === "downloading"
                    ? "Updating..."
                    : updateStatus === "ready"
                      ? "Restarting..."
                      : "Update Now"}
                </Button>
              </HStack>
            </Stack>
          </Box>
        </Flex>
      )}

      {tabContextMenu && contextMenuTab && (
        <Box
          role="menu"
          position="fixed"
          left={`${tabContextMenu.x}px`}
          top={`${tabContextMenu.y}px`}
          zIndex={20}
          minW="196px"
          p={1}
          bg={panelBg}
          border="1px solid"
          borderColor={borderColor}
          borderRadius="7px"
          boxShadow="var(--shadow-soft)"
          onClick={(event) => event.stopPropagation()}
          onContextMenu={(event) => event.preventDefault()}
        >
          <Stack gap={0}>
            <Button
              role="menuitem"
              justifyContent="flex-start"
              size="xs"
              variant="ghost"
              rounded="5px"
              onClick={() => {
                setTabContextMenu(null);
                handleCloseTab(contextMenuTab.id);
              }}
            >
              <X size={13} />
              Close
            </Button>
            <Button
              role="menuitem"
              justifyContent="flex-start"
              size="xs"
              variant="ghost"
              rounded="5px"
              onClick={() => {
                setTabContextMenu(null);
                void handleSave(contextMenuTab);
              }}
            >
              <Save size={13} />
              Save
            </Button>
            <Button
              role="menuitem"
              justifyContent="flex-start"
              size="xs"
              variant="ghost"
              rounded="5px"
              onClick={() => {
                setTabContextMenu(null);
                void handleSaveAs(contextMenuTab);
              }}
            >
              <Download size={13} />
              Save As
            </Button>
            <Box h="1px" my={1} bg={borderColor} />
            <Button
              role="menuitem"
              justifyContent="flex-start"
              size="xs"
              variant="ghost"
              rounded="5px"
              disabled={!nativeApp || !contextMenuTab.nativePath}
              onClick={() => void handleRevealTabFile(contextMenuTab)}
            >
              <FolderSearch size={13} />
              Open in Folder
            </Button>
            <Button
              role="menuitem"
              justifyContent="flex-start"
              size="xs"
              variant="ghost"
              rounded="5px"
              disabled={!nativeApp || !contextMenuTab.nativePath}
              onClick={() => void handleOpenTabFileExternal(contextMenuTab)}
            >
              <ExternalLink size={13} />
              Open in Viewer
            </Button>
          </Stack>
        </Box>
      )}

      {settingsOpen && (
        <Flex
          position="fixed"
          inset={0}
          zIndex={30}
          align="center"
          justify="center"
          bg="rgba(15, 23, 42, 0.34)"
          p={4}
          onClick={() => setSettingsOpen(false)}
        >
          <Box
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-title"
            w="min(560px, 100%)"
            maxH="min(620px, calc(100vh - 32px))"
            overflow="hidden"
            bg={panelBg}
            color={selectedTabColor}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="8px"
            boxShadow="var(--shadow-soft)"
            onClick={(event) => event.stopPropagation()}
          >
            <Flex
              align="center"
              justify="space-between"
              gap={3}
              px={3}
              py={2}
              borderBottom="1px solid"
              borderBottomColor={borderColor}
            >
              <HStack gap={2} minW={0}>
                <Settings size={15} />
                <Text id="settings-title" fontSize="sm" fontWeight="700">
                  Settings
                </Text>
              </HStack>
              <IconButton
                aria-label="Close settings"
                size="xs"
                variant="ghost"
                rounded="5px"
                onClick={() => setSettingsOpen(false)}
              >
                <X size={14} />
              </IconButton>
            </Flex>

            <HStack
              gap={0}
              p={2}
              borderBottom="1px solid"
              borderBottomColor={borderColor}
              bg={tabStripBg}
            >
              <Button
                aria-pressed={settingsTab === "editor"}
                size="xs"
                rounded="5px"
                variant={settingsTab === "editor" ? "solid" : "ghost"}
                onClick={() => setSettingsTab("editor")}
              >
                <Code2 size={13} />
                Editor
              </Button>
              <Button
                aria-pressed={settingsTab === "general"}
                size="xs"
                rounded="5px"
                variant={settingsTab === "general" ? "solid" : "ghost"}
                onClick={() => setSettingsTab("general")}
              >
                <Braces size={13} />
                General
              </Button>
            </HStack>

            <Stack gap={3} p={3} overflowY="auto">
              {settingsTab === "editor" ? (
                <>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack gap={0} minW={0}>
                      <Text fontSize="sm" fontWeight="650">
                        Minimap
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {showMinimap ? "Visible" : "Hidden"}
                      </Text>
                    </Stack>
                    <Button
                      aria-pressed={showMinimap}
                      size="xs"
                      rounded="5px"
                      variant={showMinimap ? "solid" : "subtle"}
                      onClick={() => setShowMinimap((current) => !current)}
                    >
                      {showMinimap ? "On" : "Off"}
                    </Button>
                  </Flex>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack gap={0} minW={0}>
                      <Text fontSize="sm" fontWeight="650">
                        Code Folding
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {enableFolding ? "Enabled" : "Disabled"}
                      </Text>
                    </Stack>
                    <Button
                      aria-pressed={enableFolding}
                      size="xs"
                      rounded="5px"
                      variant={enableFolding ? "solid" : "subtle"}
                      onClick={() => setEnableFolding((current) => !current)}
                    >
                      {enableFolding ? "On" : "Off"}
                    </Button>
                  </Flex>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack gap={0} minW={0}>
                      <Text fontSize="sm" fontWeight="650">
                        Word Wrap
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {wordWrap ? "Enabled" : "Disabled"}
                      </Text>
                    </Stack>
                    <Button
                      aria-pressed={wordWrap}
                      size="xs"
                      rounded="5px"
                      variant={wordWrap ? "solid" : "subtle"}
                      onClick={() => setWordWrap((current) => !current)}
                    >
                      {wordWrap ? "On" : "Off"}
                    </Button>
                  </Flex>
                </>
              ) : (
                <>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack gap={0} minW={0}>
                      <Text fontSize="sm" fontWeight="650">
                        File Navigation
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {isSideNav ? "Side navigation" : "Horizontal tabs"}
                      </Text>
                    </Stack>
                    <Button
                      aria-pressed={isSideNav}
                      size="xs"
                      rounded="5px"
                      variant="subtle"
                      onClick={() => setNavigationLayout(nextNavigationLayout)}
                    >
                      {isSideNav ? "Side Nav" : "Tabs"}
                    </Button>
                  </Flex>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack gap={0} minW={0}>
                      <Text fontSize="sm" fontWeight="650">
                        Appearance
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {colorMode === "dark" ? "Dark mode" : "Light mode"}
                      </Text>
                    </Stack>
                    <ColorModeButton size="xs" variant="solid" rounded="5px" />
                  </Flex>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack gap={0} minW={0}>
                      <Text fontSize="sm" fontWeight="650">
                        Updates
                      </Text>
                      <Text fontSize="xs" color={mutedTextColor}>
                        {updateStatus === "checking"
                          ? "Checking..."
                          : online
                            ? "Ready to check"
                            : "Offline"}
                      </Text>
                    </Stack>
                    <Button
                      size="xs"
                      rounded="5px"
                      variant="subtle"
                      disabled={updateStatus === "checking" || !online}
                      onClick={() => void checkForAppUpdate(true)}
                    >
                      Check
                    </Button>
                  </Flex>
                </>
              )}
            </Stack>
          </Box>
        </Flex>
      )}

      {!isSideNav && (
        <Flex
          borderBottom="1px solid"
          borderBottomColor={borderColor}
          align="center"
          gap={0}
          overflowX="auto"
          bg={tabStripBg}
        >
          {tabs.map((tab) => renderTabNavItem(tab, "horizontal"))}
        </Flex>
      )}

      <Flex flex="1" minH={0}>
        {isSideNav && (
          <Flex
            as="nav"
            aria-label="Open tabs"
            direction="column"
            position="relative"
            w={`${sideNavWidth}px`}
            minW={`${minSideNavWidth}px`}
            maxW={`${maxSideNavWidth}px`}
            overflowY="auto"
            bg={tabStripBg}
            borderRight="1px solid"
            borderRightColor={borderColor}
          >
            {tabs.map((tab) => renderTabNavItem(tab, "vertical"))}
            <Box
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize side navigation"
              position="absolute"
              top={0}
              right={0}
              w="8px"
              h="100%"
              cursor="col-resize"
              zIndex={1}
              onPointerDown={handleSideNavResizeStart}
              _after={{
                content: '""',
                position: "absolute",
                top: 0,
                right: "3px",
                w: "1px",
                h: "100%",
                bg: borderColor,
              }}
            />
          </Flex>
        )}

        <Box flex="1" minW={0} minH={0} position="relative">
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
                  folding: enableFolding && activeTab.language !== "plaintext",
                  glyphMargin: false,
                  lineDecorationsWidth: 8,
                  minimap: { enabled: showMinimap },
                  lineNumbers: "on",
                  lineNumbersMinChars: 4,
                  wordWrap: wordWrap ? "on" : "off",
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
      </Flex>

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
