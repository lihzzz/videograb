use crate::models::{DownloadTask, VideoInfo};
use crate::services::downloader::DownloadManager;
use crate::services::ytdlp::YtDlpService;
use std::sync::Arc;
use tauri::Manager;
use tauri_plugin_dialog::DialogExt;

/// 获取视频信息
#[tauri::command]
pub async fn fetch_video_info(
    url: String,
    ytdlp: tauri::State<'_, Arc<YtDlpService>>,
) -> Result<VideoInfo, String> {
    ytdlp.fetch_video_info(&url).await
}

/// 开始下载
#[tauri::command]
pub async fn start_download(
    url: String,
    format_id: String,
    output_path: String,
    title: String,
    thumbnail: Option<String>,
    is_playlist: Option<bool>,
    playlist_start: Option<i32>,
    playlist_end: Option<i32>,
    playlist_items: Option<String>,
    _ytdlp: tauri::State<'_, Arc<YtDlpService>>,
    downloader: tauri::State<'_, Arc<DownloadManager>>,
) -> Result<String, String> {
    // 创建任务
    let task_id = downloader
        .create_task(
            url.clone(),
            title,
            format_id,
            output_path,
            thumbnail,
            is_playlist.unwrap_or(false),
            playlist_start,
            playlist_end,
            playlist_items,
        )
        .await;

    // 开始下载
    downloader.start_download(&task_id).await?;

    Ok(task_id)
}

/// 取消下载
#[tauri::command]
pub async fn cancel_download(
    task_id: String,
    downloader: tauri::State<'_, Arc<DownloadManager>>,
) -> Result<(), String> {
    downloader.cancel_download(&task_id).await
}

/// 获取所有下载任务
#[tauri::command]
pub async fn get_download_tasks(
    downloader: tauri::State<'_, Arc<DownloadManager>>,
) -> Result<Vec<DownloadTask>, String> {
    Ok(downloader.get_tasks().await)
}

/// 选择下载文件夹
#[tauri::command]
pub async fn select_download_folder(
    app: tauri::AppHandle,
) -> Result<Option<String>, String> {
    // 使用 tauri-plugin-dialog 的异步 API
    let result = app.dialog().file().blocking_pick_folder();

    match result {
        Some(path) => {
            let path = path
                .into_path()
                .map_err(|e| format!("无效的文件夹路径: {}", e))?;
            Ok(Some(path.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}

/// 获取默认下载路径
#[tauri::command]
pub async fn get_default_download_path(
    app: tauri::AppHandle,
) -> Result<String, String> {
    let download_dir = app
        .path()
        .download_dir()
        .map_err(|e| format!("无法获取下载目录: {}", e))?;

    Ok(download_dir.to_string_lossy().to_string())
}

/// 设置下载代理（为空时清除代理）
#[tauri::command]
pub async fn set_proxy_config(
    proxy: Option<String>,
    ytdlp: tauri::State<'_, Arc<YtDlpService>>,
) -> Result<(), String> {
    ytdlp.set_proxy(proxy).await;
    Ok(())
}

/// 设置下载Cookies（为空时清除cookies）
#[tauri::command]
pub async fn set_cookies_config(
    cookies: Option<String>,
    ytdlp: tauri::State<'_, Arc<YtDlpService>>,
) -> Result<(), String> {
    ytdlp.set_cookies(cookies).await;
    Ok(())
}

/// 更新 yt-dlp
#[tauri::command]
pub async fn update_ytdlp(
    _ytdlp: tauri::State<'_, Arc<YtDlpService>>,
) -> Result<(), String> {
    _ytdlp.update_ytdlp().await
}
