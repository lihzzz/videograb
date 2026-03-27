use crate::models::VideoInfo;
use std::path::{Path, PathBuf};
use std::process::Stdio;
use tauri::{AppHandle, Manager};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;

pub struct YtDlpService {
    ytdlp_path: PathBuf,
    proxy: RwLock<Option<String>>,
}

impl YtDlpService {
    pub fn new(app_handle: AppHandle) -> Self {
        let ytdlp_path = get_ytdlp_path(&app_handle);
        Self {
            ytdlp_path,
            proxy: RwLock::new(None),
        }
    }

    pub async fn set_proxy(&self, proxy: Option<String>) {
        let normalized = proxy
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let mut current = self.proxy.write().await;
        *current = normalized;
    }

    async fn current_proxy(&self) -> Option<String> {
        self.proxy.read().await.clone()
    }

    /// 更新 yt-dlp
    pub async fn update_ytdlp(&self) -> Result<(), String> {
        let mut command = Command::new(&self.ytdlp_path);
        command.arg("-U");

        let output = command
            .output()
            .await
            .map_err(|e| format!("执行 yt-dlp 更新失败: {}", e))?;

        if !output.status.success() {
            return Err(format_command_failure(
                "更新 yt-dlp 失败",
                &output.status,
                &output.stderr,
                &output.stdout,
            ));
        }

        Ok(())
    }

    /// 获取视频信息
    pub async fn fetch_video_info(&self, url: &str) -> Result<VideoInfo, String> {
        let mut command = Command::new(&self.ytdlp_path);
        command.args(["--dump-json", "--no-download", "--no-warnings"]);
        if let Some(proxy) = self.current_proxy().await {
            command.arg("--proxy").arg(proxy);
        }
        command.arg(url);

        let output = command
            .output()
            .await
            .map_err(|e| format!("执行 yt-dlp 失败: {}", e))?;

        if !output.status.success() {
            return Err(format_command_failure(
                "获取视频信息失败",
                &output.status,
                &output.stderr,
                &output.stdout,
            ));
        }

        let info: VideoInfo = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("解析视频信息失败: {}", e))?;

        Ok(info)
    }

    /// 开始下载，返回子进程
    pub async fn start_download(
        &self,
        url: &str,
        format_id: &str,
        output_path: &str,
        task_id: &str,
        is_playlist: bool,
        playlist_start: Option<i32>,
        playlist_end: Option<i32>,
        playlist_items: Option<&str>,
    ) -> Result<Child, String> {
        let mut command = Command::new(&self.ytdlp_path);
        command.args([
            "-f",
            format_id,
            "-o",
            output_path,
            "--newline",
            "--progress",
            "--progress-template",
            "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s",
            "--no-warnings",
        ]);

        // 添加播放列表相关参数
        if is_playlist {
            if let Some(start) = playlist_start {
                command.arg("--playlist-start").arg(start.to_string());
            }
            if let Some(end) = playlist_end {
                command.arg("--playlist-end").arg(end.to_string());
            }
            if let Some(items) = playlist_items {
                command.arg("--playlist-items").arg(items);
            }
        } else {
            // 不是播放列表则只下载第一个视频
            command.arg("--playlist-start").arg("1").arg("--playlist-end").arg("1");
        }

        if let Some(proxy) = self.current_proxy().await {
            command.arg("--proxy").arg(proxy);
        }
        command.arg(url);

        let child = command
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| format!("启动下载失败: {}", e))?;

        // 进度输出由 DownloadManager 统一读取并更新状态
        let _ = task_id;

        Ok(child)
    }
}

/// 获取 yt-dlp 可执行文件路径
fn get_ytdlp_path(app_handle: &AppHandle) -> PathBuf {
    // 开发环境优先使用本地固定路径
    let local_path = Path::new("/Users/lh/local/yt-dlp_macos");
    if local_path.exists() {
        return local_path.to_path_buf();
    }

    // 首先尝试使用内嵌的二进制文件
    if let Ok(resource_dir) = app_handle.path().resource_dir() {
        let embedded_path = resource_dir.join("binaries/yt-dlp");
        if embedded_path.exists() {
            return embedded_path;
        }
    }

    // 回退到系统 PATH 中的 yt-dlp
    PathBuf::from("yt-dlp")
}

fn format_command_failure(
    context: &str,
    status: &std::process::ExitStatus,
    stderr: &[u8],
    stdout: &[u8],
) -> String {
    let stderr_text = String::from_utf8_lossy(stderr).trim().to_string();
    let stdout_text = String::from_utf8_lossy(stdout).trim().to_string();
    let code = status
        .code()
        .map(|c| c.to_string())
        .unwrap_or_else(|| "unknown".to_string());

    if !stderr_text.is_empty() {
        format!("{} (exit {}): {}", context, code, stderr_text)
    } else if !stdout_text.is_empty() {
        format!("{} (exit {}): {}", context, code, stdout_text)
    } else {
        format!("{} (exit {})", context, code)
    }
}
