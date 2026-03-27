use crate::models::{DownloadProgress, DownloadStatus, DownloadTask, TaskStatus};
use crate::services::ytdlp::YtDlpService;
use std::collections::HashMap;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, AsyncRead, BufReader};
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use uuid::Uuid;

pub struct DownloadManager {
    pub app_handle: AppHandle,
    ytdlp: Arc<YtDlpService>,
    tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    running_tasks: Arc<Mutex<HashMap<String, JoinHandle<()>>>>,
}

impl DownloadManager {
    pub fn new(app_handle: AppHandle, ytdlp: Arc<YtDlpService>) -> Self {
        Self {
            app_handle,
            ytdlp,
            tasks: Arc::new(Mutex::new(HashMap::new())),
            running_tasks: Arc::new(Mutex::new(HashMap::new())),
        }
    }

    /// 创建新任务
    pub async fn create_task(
        &self,
        url: String,
        title: String,
        format_id: String,
        output_path: String,
        thumbnail: Option<String>,
        is_playlist: bool,
        playlist_start: Option<i32>,
        playlist_end: Option<i32>,
        playlist_items: Option<String>,
    ) -> String {
        let task_id = Uuid::new_v4().to_string();
        let task = DownloadTask {
            id: task_id.clone(),
            url,
            title,
            status: TaskStatus::Pending,
            progress: 0.0,
            speed: String::new(),
            eta: String::new(),
            output_path,
            format_id,
            thumbnail,
            is_playlist,
            playlist_start,
            playlist_end,
            playlist_items,
            created_at: chrono::Utc::now().to_rfc3339(),
        };

        let mut tasks = self.tasks.lock().await;
        tasks.insert(task_id.clone(), task);

        task_id
    }

    /// 开始下载
    pub async fn start_download(&self, task_id: &str) -> Result<(), String> {
        let task = {
            let mut tasks = self.tasks.lock().await;
            let task = tasks
                .get_mut(task_id)
                .ok_or("任务不存在")?;
            task.status = TaskStatus::Downloading;
            task.clone()
        };

        let ytdlp = self.ytdlp.clone();
        let app_handle = self.app_handle.clone();
        let tasks_clone = self.tasks.clone();
        let running_tasks = self.running_tasks.clone();
        let task_id_clone = task_id.to_string();

        let handle = tokio::spawn(async move {
            let result = async {
                let mut child = ytdlp
                    .start_download(
                        &task.url,
                        &task.format_id,
                        &task.output_path,
                        &task_id_clone,
                        task.is_playlist,
                        task.playlist_start,
                        task.playlist_end,
                        task.playlist_items.as_deref(),
                    )
                    .await?;

                let stdout = child.stdout.take().ok_or("无法获取 stdout")?;
                let stderr = child.stderr.take().ok_or("无法获取 stderr")?;
                spawn_progress_reader(
                    stdout,
                    app_handle.clone(),
                    tasks_clone.clone(),
                    task_id_clone.clone(),
                );
                spawn_progress_reader(
                    stderr,
                    app_handle.clone(),
                    tasks_clone.clone(),
                    task_id_clone.clone(),
                );

                // 等待下载完成
                let status = child
                    .wait()
                    .await
                    .map_err(|e| format!("等待进程失败: {}", e))?;

                let mut tasks = tasks_clone.lock().await;
                let task = tasks
                    .get_mut(&task_id_clone)
                    .ok_or("任务不存在")?;

                if status.success() {
                    task.status = TaskStatus::Completed;
                    task.progress = 100.0;
                } else {
                    task.status = TaskStatus::Failed;
                }

                // 发送状态变更事件
                let _ = app_handle.emit(
                    "download-status",
                    DownloadStatus {
                        task_id: task_id_clone.clone(),
                        status: task.status.clone(),
                        error: None,
                    },
                );

                Ok(())
            }
            .await;

            if let Err(e) = result {
                let mut tasks = tasks_clone.lock().await;
                if let Some(task) = tasks.get_mut(&task_id_clone) {
                    task.status = TaskStatus::Failed;
                }

                let _ = app_handle.emit(
                    "download-status",
                    DownloadStatus {
                        task_id: task_id_clone.clone(),
                        status: TaskStatus::Failed,
                        error: Some(e),
                    },
                );
            }

            // 清理运行中的任务
            let mut running = running_tasks.lock().await;
            running.remove(&task_id_clone);
        });

        let mut running = self.running_tasks.lock().await;
        running.insert(task_id.to_string(), handle);

        Ok(())
    }

    /// 取消下载
    pub async fn cancel_download(&self, task_id: &str) -> Result<(), String> {
        // 停止任务
        let mut running = self.running_tasks.lock().await;
        if let Some(handle) = running.remove(task_id) {
            handle.abort();
        }

        // 更新任务状态
        let mut tasks = self.tasks.lock().await;
        if let Some(task) = tasks.get_mut(task_id) {
            task.status = TaskStatus::Cancelled;
        }

        // 发送状态变更事件
        let _ = self.app_handle.emit(
            "download-status",
            DownloadStatus {
                task_id: task_id.to_string(),
                status: TaskStatus::Cancelled,
                error: None,
            },
        );

        Ok(())
    }

    /// 获取所有任务
    pub async fn get_tasks(&self) -> Vec<DownloadTask> {
        let tasks = self.tasks.lock().await;
        tasks.values().cloned().collect()
    }

    /// 获取单个任务
    pub async fn get_task(&self, task_id: &str) -> Option<DownloadTask> {
        let tasks = self.tasks.lock().await;
        tasks.get(task_id).cloned()
    }

    /// 更新任务进度
    pub async fn update_progress(&self, task_id: &str, progress: DownloadProgress) {
        let mut tasks = self.tasks.lock().await;
        if let Some(task) = tasks.get_mut(task_id) {
            task.progress = progress.percent;
            task.speed = progress.speed;
            task.eta = progress.eta;
        }
    }
}

fn parse_progress_line(line: &str) -> Option<(f64, String, String)> {
    let line = strip_ansi_escape_codes(line);
    let line = line.trim();
    if !line.contains('%') {
        return None;
    }

    let parts: Vec<&str> = line.split('|').collect();
    if parts.len() >= 3 {
        let percent_str = parts[0]
            .split_whitespace()
            .last()
            .unwrap_or(parts[0])
            .trim()
            .trim_end_matches('%');
        let percent = percent_str.parse::<f64>().ok()?;
        let speed = parts[1].trim().to_string();
        let eta = parts[2].trim().to_string();
        Some((percent, speed, eta))
    } else {
        parse_default_download_line(line)
    }
}

fn parse_default_download_line(line: &str) -> Option<(f64, String, String)> {
    if !line.contains("[download]") || !line.contains('%') {
        return None;
    }

    let percent_raw = line.split('%').next()?;
    let percent_str = percent_raw.split_whitespace().last()?.trim();
    let percent = percent_str.parse::<f64>().ok()?;

    let speed = if let Some((_, rest)) = line.split_once(" at ") {
        rest.split(" ETA ").next().unwrap_or("未知速度").trim().to_string()
    } else {
        "未知速度".to_string()
    };

    let eta = if let Some((_, rest)) = line.split_once(" ETA ") {
        rest.trim().to_string()
    } else {
        "--:--".to_string()
    };

    Some((percent, speed, eta))
}

fn spawn_progress_reader<R>(
    reader: R,
    app_handle: AppHandle,
    tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    task_id: String,
) where
    R: AsyncRead + Unpin + Send + 'static,
{
    tokio::spawn(async move {
        let reader = BufReader::new(reader);
        let mut lines = reader.lines();

        while let Ok(Some(line)) = lines.next_line().await {
            if let Some((percent, speed, eta)) = parse_progress_line(&line) {
                {
                    let mut guard = tasks.lock().await;
                    if let Some(task) = guard.get_mut(&task_id) {
                        task.progress = percent;
                        task.speed = speed.clone();
                        task.eta = eta.clone();
                    }
                }

                let _ = app_handle.emit(
                    "download-progress",
                    DownloadProgress {
                        task_id: task_id.clone(),
                        percent,
                        speed,
                        eta,
                    },
                );
            }
        }
    });
}

fn strip_ansi_escape_codes(input: &str) -> String {
    let mut out = String::with_capacity(input.len());
    let mut chars = input.chars().peekable();

    while let Some(ch) = chars.next() {
        if ch == '\u{1b}' {
            if matches!(chars.peek(), Some('[')) {
                chars.next();
                while let Some(&c) = chars.peek() {
                    chars.next();
                    if ('@'..='~').contains(&c) {
                        break;
                    }
                }
            }
            continue;
        }
        out.push(ch);
    }

    out
}
