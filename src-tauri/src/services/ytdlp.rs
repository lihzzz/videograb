use crate::models::VideoInfo;
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::process::{Output, Stdio};
use tauri::{AppHandle, Manager};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;

const DEFAULT_PROXY_URL: &str = "socks5://127.0.0.1:9999";
const PLAYLIST_PREVIEW_SCAN_LIMIT: usize = 30;

pub struct YtDlpService {
    ytdlp_path: PathBuf,
    proxy: RwLock<Option<String>>,
    cookies: RwLock<Option<String>>,
}

impl YtDlpService {
    pub fn new(app_handle: AppHandle) -> Self {
        let ytdlp_path = get_ytdlp_path(&app_handle);
        Self {
            ytdlp_path,
            proxy: RwLock::new(Some(DEFAULT_PROXY_URL.to_string())),
            cookies: RwLock::new(None),
        }
    }

    pub async fn set_proxy(&self, proxy: Option<String>) {
        let normalized = proxy
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let mut current = self.proxy.write().await;
        *current = normalized;
    }

    pub async fn set_cookies(&self, cookies: Option<String>) {
        let normalized = cookies
            .map(|value| value.trim().to_string())
            .filter(|value| !value.is_empty());
        let mut current = self.cookies.write().await;
        *current = normalized;
    }

    async fn current_proxy(&self) -> Option<String> {
        self.proxy.read().await.clone()
    }

    async fn current_cookies(&self) -> Option<String> {
        self.cookies.read().await.clone()
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
        let mut errors: Vec<String> = Vec::new();

        // 1) 优先 flat-playlist 轻量探测
        match self
            .run_info_json(url, PlaylistMode::Auto, true, true)
            .await
        {
            Ok(probe_value) => {
                if let Some(result) = self.try_parse_video_info(url, &probe_value).await {
                    return result;
                }
                errors.push("flat-playlist 返回内容不可用".to_string());
            }
            Err(err) => {
                errors.push(err);
            }
        }

        // 2) 回退到 no-playlist 直接拉单视频详情
        match self
            .run_info_json(url, PlaylistMode::NoPlaylist, false, false)
            .await
        {
            Ok(value) => {
                if let Some(result) = self.try_parse_video_info(url, &value).await {
                    return result;
                }
                errors.push("no-playlist 返回内容不可用".to_string());
            }
            Err(err) => {
                errors.push(err);
            }
        }

        // 3) 最后再走一次 yes-playlist 全量信息
        match self
            .run_info_json(url, PlaylistMode::Auto, false, false)
            .await
        {
            Ok(value) => {
                if let Some(result) = self.try_parse_video_info(url, &value).await {
                    return result;
                }
                errors.push("yes-playlist 返回内容不可用".to_string());
            }
            Err(err) => {
                errors.push(err);
            }
        }

        Err(errors
            .last()
            .cloned()
            .unwrap_or_else(|| "获取视频信息失败: 未返回可用 JSON".to_string()))
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
        command.kill_on_drop(true);
        let mut args = vec![
            "-f",
            format_id,
            "-o",
            output_path,
            "--newline",
            "--progress",
            "--progress-template",
            "%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s",
            "--no-warnings",
            "--ignore-config",
        ];

        if is_playlist {
            args.extend(&["--yes-playlist", "--ignore-errors"]);
        } else {
            args.extend(&["--no-playlist"]);
        }

        command.args(args);

        if is_playlist {
            if let Some(item_spec) =
                build_playlist_item_spec(playlist_start, playlist_end, playlist_items)
            {
                command.arg("--playlist-items").arg(item_spec);
            }
        }

        self.apply_network_args(&mut command).await;
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

    async fn build_playlist_preview(
        &self,
        source_url: &str,
        playlist_value: &Value,
    ) -> Result<VideoInfo, String> {
        let entries = playlist_value
            .get("entries")
            .and_then(Value::as_array)
            .ok_or_else(|| "播放列表缺少可用条目".to_string())?;

        let context = PlaylistContext {
            title: read_string_field(playlist_value, &["title", "playlist_title"]),
            playlist_id: read_string_field(playlist_value, &["id", "playlist_id"]),
            count: read_i32_field(playlist_value, &["playlist_count", "n_entries"])
                .or_else(|| i32::try_from(entries.len()).ok()),
        };

        for entry in entries.iter().take(PLAYLIST_PREVIEW_SCAN_LIMIT) {
            if let Ok(info) = self.deserialize_video_info(entry.clone(), "解析播放列表条目失败") {
                return Ok(apply_playlist_context(info, &context));
            }

            if let Some(entry_url) = resolve_entry_url(entry, source_url) {
                if let Ok(entry_value) = self
                    .run_info_json(&entry_url, PlaylistMode::NoPlaylist, false, false)
                    .await
                {
                    if let Ok(info) = self.deserialize_video_info(entry_value, "解析条目详情失败") {
                        return Ok(apply_playlist_context(info, &context));
                    }
                }
            }
        }

        Err("播放列表中没有可解析的公开视频条目，请检查 cookies 或列表权限".to_string())
    }

    fn deserialize_video_info(&self, value: Value, context: &str) -> Result<VideoInfo, String> {
        serde_json::from_value(value).map_err(|e| format!("{}: {}", context, e))
    }

    async fn try_parse_video_info(
        &self,
        source_url: &str,
        value: &Value,
    ) -> Option<Result<VideoInfo, String>> {
        if value.is_null() {
            return None;
        }

        if is_playlist_payload(value) {
            return Some(self.build_playlist_preview(source_url, value).await);
        }

        Some(self.deserialize_video_info(value.clone(), "解析视频信息失败"))
    }

    async fn run_info_json(
        &self,
        url: &str,
        playlist_mode: PlaylistMode,
        flat_playlist: bool,
        ignore_errors: bool,
    ) -> Result<Value, String> {
        let mut command = Command::new(&self.ytdlp_path);
        command.args([
            "--dump-single-json",
            "--no-download",
            "--no-warnings",
            "--ignore-config",
        ]);
        if ignore_errors {
            command.arg("--ignore-errors");
        }

        match playlist_mode {
            PlaylistMode::Auto => {
                command.arg("--yes-playlist");
            }
            PlaylistMode::NoPlaylist => {
                command.arg("--no-playlist");
            }
        }
        if flat_playlist {
            command.arg("--flat-playlist");
        }

        self.apply_network_args(&mut command).await;
        command.arg(url);

        let output = command
            .output()
            .await
            .map_err(|e| format!("执行 yt-dlp 失败: {}", e))?;

        parse_json_output("获取视频信息失败", output)
    }

    async fn apply_network_args(&self, command: &mut Command) {
        if let Some(proxy) = self.current_proxy().await {
            command.arg("--proxy").arg(proxy);
        }
        if let Some(cookies) = self.current_cookies().await {
            command.arg("--cookies").arg(cookies);
        }
    }
}

#[derive(Clone, Copy)]
enum PlaylistMode {
    Auto,
    NoPlaylist,
}

struct PlaylistContext {
    title: Option<String>,
    playlist_id: Option<String>,
    count: Option<i32>,
}

fn is_playlist_payload(value: &Value) -> bool {
    value
        .get("_type")
        .and_then(Value::as_str)
        .map(|kind| kind == "playlist")
        .unwrap_or(false)
        || value
            .get("entries")
            .and_then(Value::as_array)
            .map(|entries| !entries.is_empty())
            .unwrap_or(false)
}

fn apply_playlist_context(mut info: VideoInfo, context: &PlaylistContext) -> VideoInfo {
    info.is_playlist = Some(true);
    if let Some(title) = &context.title {
        info.playlist_title = Some(title.clone());
        if info.title.trim().is_empty() {
            info.title = title.clone();
        }
    }
    if let Some(playlist_id) = &context.playlist_id {
        info.playlist_id = Some(playlist_id.clone());
    }
    if let Some(count) = context.count {
        info.playlist_count = Some(count);
    }
    info
}

fn resolve_entry_url(entry: &Value, source_url: &str) -> Option<String> {
    if let Some(webpage_url) = entry.get("webpage_url").and_then(Value::as_str) {
        if webpage_url.starts_with("http://") || webpage_url.starts_with("https://") {
            return Some(webpage_url.to_string());
        }
    }

    if let Some(raw_url) = entry.get("url").and_then(Value::as_str) {
        if raw_url.starts_with("http://") || raw_url.starts_with("https://") {
            return Some(raw_url.to_string());
        }
        if raw_url.starts_with("watch?v=") || raw_url.starts_with("shorts/") {
            return Some(format!("https://www.youtube.com/{}", raw_url));
        }
    }

    if source_url.contains("youtube.com") || source_url.contains("youtu.be") {
        if let Some(video_id) = entry.get("id").and_then(Value::as_str) {
            return Some(format!("https://www.youtube.com/watch?v={}", video_id));
        }
    }

    None
}

fn read_string_field(value: &Value, keys: &[&str]) -> Option<String> {
    keys.iter()
        .find_map(|key| value.get(*key).and_then(Value::as_str))
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
}

fn read_i32_field(value: &Value, keys: &[&str]) -> Option<i32> {
    keys.iter()
        .filter_map(|key| value.get(*key))
        .find_map(|v| v.as_i64().and_then(|n| i32::try_from(n).ok()))
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

fn parse_json_output(context: &str, output: Output) -> Result<Value, String> {
    if !output.stdout.is_empty() {
        if let Ok(value) = serde_json::from_slice::<Value>(&output.stdout) {
            if value.is_null() {
                let stderr_text = String::from_utf8_lossy(&output.stderr).trim().to_string();
                if !stderr_text.is_empty() {
                    return Err(format!("{}: {}", context, stderr_text));
                }
                return Err(format!("{}: yt-dlp 返回空结果(null)", context));
            }
            return Ok(value);
        }
    }

    Err(format_command_failure(
        context,
        &output.status,
        &output.stderr,
        &output.stdout,
    ))
}

fn build_playlist_item_spec(
    playlist_start: Option<i32>,
    playlist_end: Option<i32>,
    playlist_items: Option<&str>,
) -> Option<String> {
    if let Some(items) = playlist_items {
        let normalized_items = items.trim();
        if !normalized_items.is_empty() {
            return Some(normalized_items.to_string());
        }
    }

    let start = playlist_start.unwrap_or(1).max(1);
    match playlist_end {
        Some(end) if end >= start => Some(format!("{}:{}", start, end)),
        Some(_) => Some(start.to_string()),
        None if start > 1 => Some(format!("{}:", start)),
        None => None,
    }
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
