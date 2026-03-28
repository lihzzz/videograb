import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import type { VideoInfo, DownloadTask, DownloadProgress } from "../types/download";

const PROXY_STORAGE_KEY = "videograb.proxy";
const COOKIES_STORAGE_KEY = "videograb.cookies";
const DEFAULT_PROXY = "socks5://127.0.0.1:9999";

function readStoredProxy(): string {
  if (typeof window === "undefined") return DEFAULT_PROXY;
  const stored = window.localStorage.getItem(PROXY_STORAGE_KEY);
  if (stored === null) return DEFAULT_PROXY;
  return stored.trim();
}

function readStoredCookies(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(COOKIES_STORAGE_KEY) || "").trim();
}

function persistProxy(proxy: string) {
  if (typeof window === "undefined") return;
  if (proxy) {
    window.localStorage.setItem(PROXY_STORAGE_KEY, proxy);
  } else {
    window.localStorage.removeItem(PROXY_STORAGE_KEY);
  }
}

function persistCookies(cookies: string) {
  if (typeof window === "undefined") return;
  if (cookies) {
    window.localStorage.setItem(COOKIES_STORAGE_KEY, cookies);
  } else {
    window.localStorage.removeItem(COOKIES_STORAGE_KEY);
  }
}

function getErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === "string" && err.trim()) return err;
  if (err && typeof err === "object") {
    const maybeMessage = (err as { message?: unknown }).message;
    if (typeof maybeMessage === "string" && maybeMessage.trim()) return maybeMessage;
  }
  return fallback;
}

function buildOutputTemplate(outputDirectory: string, isPlaylist: boolean = false): string {
  const base = outputDirectory.trim().replace(/\/+$/, "");
  if (isPlaylist) {
    return `${base}/%(playlist)s/%(playlist_index)s - %(title)s.%(ext)s`;
  }
  return `${base}/%(title)s.%(ext)s`;
}

interface DownloadStore {
  // 状态
  tasks: DownloadTask[];
  currentUrl: string;
  currentVideo: VideoInfo | null;
  selectedFormat: string | null;
  proxy: string;
  cookies: string;
  isLoading: boolean;
  error: string | null;
  isUpdatingYtdlp: boolean;
  playlistParams: {
    start: number;
    end: number | null;
    items: string;
  };

  // 方法
  setCurrentUrl: (url: string) => void;
  setSelectedFormat: (formatId: string | null) => void;
  setProxy: (proxy: string) => void;
  setCookies: (cookies: string) => void;
  syncProxyConfig: () => Promise<void>;
  syncCookiesConfig: () => Promise<void>;
  fetchVideoInfo: (url: string) => Promise<void>;
  startDownload: (outputPath: string, isPlaylist?: boolean) => Promise<string | null>;
  cancelDownload: (taskId: string) => Promise<void>;
  updateProgress: (taskId: string, progress: DownloadProgress) => void;
  updateTaskStatus: (taskId: string, status: DownloadTask["status"], error?: string) => void;
  clearError: () => void;
  removeTask: (taskId: string) => void;
  updatePlaylistParams: (params: { start?: number; end?: number | null; items?: string }) => void;
  updateYtdlp: () => Promise<boolean>;
}

type BackendDownloadTask = Omit<DownloadTask, "created_at" | "thumbnail" | "error"> & {
  created_at: string;
};

function normalizeBackendTask(task: BackendDownloadTask, fallback?: Partial<DownloadTask>): DownloadTask {
  const createdAt = Date.parse(task.created_at);
  return {
    ...task,
    created_at: Number.isFinite(createdAt) ? createdAt : Date.now(),
    thumbnail: fallback?.thumbnail,
    error: fallback?.error,
  };
}

function upsertTask(tasks: DownloadTask[], task: DownloadTask): DownloadTask[] {
  const index = tasks.findIndex((item) => item.id === task.id);
  if (index === -1) return [task, ...tasks];
  const next = [...tasks];
  next[index] = { ...next[index], ...task };
  return next;
}

export const useDownloadStore = create<DownloadStore>((set, get) => ({
  tasks: [],
  currentUrl: "",
  currentVideo: null,
  selectedFormat: null,
  proxy: readStoredProxy(),
  cookies: readStoredCookies(),
  isLoading: false,
  error: null,
  isUpdatingYtdlp: false,
  playlistParams: {
    start: 1,
    end: null,
    items: "",
  },

  setCurrentUrl: (url) => set({ currentUrl: url }),

  setSelectedFormat: (formatId) => set({ selectedFormat: formatId }),

  setProxy: (proxy) => {
    const normalizedProxy = proxy.trim() || DEFAULT_PROXY;
    persistProxy(normalizedProxy);
    set({ proxy: normalizedProxy });
  },

  setCookies: (cookies) => {
    const normalizedCookies = cookies.trim();
    persistCookies(normalizedCookies);
    set({ cookies: normalizedCookies });
  },

  syncProxyConfig: async () => {
    const proxy = get().proxy.trim() || DEFAULT_PROXY;
    await invoke("set_proxy_config", {
      proxy,
    });
  },

  syncCookiesConfig: async () => {
    const cookies = get().cookies.trim();
    await invoke("set_cookies_config", {
      cookies: cookies || null,
    });
  },

  clearError: () => set({ error: null }),

  removeTask: (taskId) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== taskId),
    }));
  },

  updatePlaylistParams: (params) => {
    set((state) => ({
      playlistParams: {
        ...state.playlistParams,
        ...params,
      },
    }));
  },

  updateYtdlp: async () => {
    set({ isUpdatingYtdlp: true });
    try {
      await invoke("update_ytdlp");
      return true;
    } catch (err) {
      console.error("更新 yt-dlp 失败:", err);
      set({ error: getErrorMessage(err, "更新 yt-dlp 失败") });
      return false;
    } finally {
      set({ isUpdatingYtdlp: false });
    }
  },

  fetchVideoInfo: async (url) => {
    set({ isLoading: true, error: null, currentVideo: null });
    try {
      const info = await invoke<VideoInfo>("fetch_video_info", { url });
      set({ currentVideo: info, currentUrl: url });
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "获取视频信息失败") });
    } finally {
      set({ isLoading: false });
    }
  },

  startDownload: async (outputPath, isPlaylist = false) => {
    const { currentUrl, currentVideo, selectedFormat, playlistParams } = get();
    if (!currentUrl || !currentVideo || !selectedFormat) return null;

    try {
      const downloadUrl = isPlaylist
        ? currentUrl
        : (currentVideo.webpage_url || currentUrl);
      const normalizedStart = Number.isFinite(playlistParams.start)
        ? Math.max(1, Math.trunc(playlistParams.start))
        : 1;
      const normalizedEnd =
        playlistParams.end == null || !Number.isFinite(playlistParams.end)
          ? null
          : Math.max(normalizedStart, Math.trunc(playlistParams.end));
      const normalizedItems = (playlistParams.items || "").trim();
      const outputTemplate = buildOutputTemplate(outputPath, isPlaylist);
      const taskId = await invoke<string>("start_download", {
        url: downloadUrl,
        formatId: selectedFormat,
        outputPath: outputTemplate,
        title: currentVideo.title,
        thumbnail: currentVideo.thumbnail,
        isPlaylist,
        playlistStart: isPlaylist ? normalizedStart : null,
        playlistEnd: isPlaylist ? normalizedEnd : null,
        playlistItems: isPlaylist && normalizedItems ? normalizedItems : null,
      });

      const fallbackTask: DownloadTask = {
        id: taskId,
        url: downloadUrl,
        title: currentVideo.title,
        status: "downloading",
        progress: 0,
        speed: "",
        eta: "",
        output_path: outputPath,
        format_id: selectedFormat,
        thumbnail: currentVideo.thumbnail,
        created_at: Date.now(),
        is_playlist: isPlaylist,
        playlist_title: isPlaylist ? currentVideo.playlist_title || currentVideo.title : undefined,
        playlist_size: isPlaylist ? currentVideo.playlist_count : undefined,
      };

      let taskToInsert = fallbackTask;
      try {
        const backendTasks = await invoke<BackendDownloadTask[]>("get_download_tasks");
        const backendTask = backendTasks.find((task) => task.id === taskId);
        if (backendTask) {
          taskToInsert = normalizeBackendTask(backendTask, fallbackTask);
        }
      } catch {
        // ignore sync errors and keep fallback task
      }

      set((state) => ({
        tasks: upsertTask(state.tasks, taskToInsert),
      }));

      return taskId;
    } catch (err: unknown) {
      set({ error: getErrorMessage(err, "启动下载失败") });
      return null;
    }
  },

  cancelDownload: async (taskId) => {
    try {
      await invoke("cancel_download", { taskId });
      get().updateTaskStatus(taskId, "cancelled");
    } catch (err: any) {
      console.error("取消下载失败:", err);
    }
  },

  updateProgress: (taskId, progress) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? { ...t, progress: progress.percent, speed: progress.speed, eta: progress.eta }
          : t
      ),
    }));
  },

  updateTaskStatus: (taskId, status, error) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              error,
              progress: status === "completed" ? 100 : t.progress,
            }
          : t
      ),
    }));
  },
}));

async function syncTaskFromBackend(taskId: string) {
  try {
    const backendTasks = await invoke<BackendDownloadTask[]>("get_download_tasks");
    const backendTask = backendTasks.find((task) => task.id === taskId);
    if (!backendTask) return;

    useDownloadStore.setState((state) => {
      const existing = state.tasks.find((task) => task.id === taskId);
      const normalized = normalizeBackendTask(backendTask, existing);
      return { tasks: upsertTask(state.tasks, normalized) };
    });
  } catch {
    // best effort sync
  }
}

async function syncAllTasksFromBackend() {
  try {
    const backendTasks = await invoke<BackendDownloadTask[]>("get_download_tasks");
    useDownloadStore.setState((state) => {
      const existingById = new Map(state.tasks.map((task) => [task.id, task]));
      const merged = backendTasks
        .map((task) => normalizeBackendTask(task, existingById.get(task.id)))
        .sort((a, b) => b.created_at - a.created_at);
      return { tasks: merged };
    });
  } catch {
    // best effort sync
  }
}

// 初始化事件监听
export function initEventListeners() {
  if ((globalThis as { __videograb_listeners_inited__?: boolean }).__videograb_listeners_inited__) {
    return;
  }
  (globalThis as { __videograb_listeners_inited__?: boolean }).__videograb_listeners_inited__ = true;

  void syncAllTasksFromBackend();
  setInterval(() => {
    void syncAllTasksFromBackend();
  }, 1000);

  // 监听下载进度
  listen<DownloadProgress>("download-progress", async (event) => {
    const { task_id, ...progress } = event.payload;
    const hasTask = useDownloadStore.getState().tasks.some((task) => task.id === task_id);
    if (!hasTask) {
      await syncTaskFromBackend(task_id);
    }
    useDownloadStore.getState().updateProgress(task_id, { task_id, ...progress });
  });

  // 监听状态变更
  listen<{ task_id: string; status: DownloadTask["status"]; error?: string }>(
    "download-status",
    async (event) => {
      const { task_id, status, error } = event.payload;
      const hasTask = useDownloadStore.getState().tasks.some((task) => task.id === task_id);
      if (!hasTask) {
        await syncTaskFromBackend(task_id);
      }
      useDownloadStore.getState().updateTaskStatus(task_id, status, error);
    }
  );
}
