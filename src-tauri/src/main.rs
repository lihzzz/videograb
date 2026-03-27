#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod commands;
mod models;
mod services;

use services::downloader::DownloadManager;
use services::ytdlp::YtDlpService;
use std::sync::Arc;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // 初始化 yt-dlp 服务
            let ytdlp = Arc::new(YtDlpService::new(app.handle().clone()));

            // 初始化下载管理器
            let downloader = Arc::new(DownloadManager::new(app.handle().clone(), ytdlp.clone()));

            // 存储状态
            app.manage(ytdlp);
            app.manage(downloader);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::fetch_video_info,
            commands::start_download,
            commands::cancel_download,
            commands::get_download_tasks,
            commands::select_download_folder,
            commands::get_default_download_path,
            commands::set_proxy_config,
            commands::update_ytdlp,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
