use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoFormat {
    pub format_id: String,
    pub ext: String,
    pub format: Option<String>,
    #[serde(rename = "format_note")]
    pub format_note: Option<String>,
    pub resolution: Option<String>,
    pub width: Option<i32>,
    pub height: Option<i32>,
    pub fps: Option<f64>,
    pub filesize: Option<i64>,
    #[serde(rename = "filesize_approx")]
    pub filesize_approx: Option<i64>,
    pub tbr: Option<f64>,
    pub abr: Option<f64>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub asr: Option<i32>,
    #[serde(rename = "audio_channels")]
    pub audio_channels: Option<i32>,
    pub quality: Option<f64>,
}

impl VideoFormat {
    pub fn has_video(&self) -> bool {
        self.vcodec.as_ref().map_or(false, |c| c != "none")
    }

    pub fn has_audio(&self) -> bool {
        self.acodec.as_ref().map_or(false, |c| c != "none")
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoInfo {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub thumbnail: String,
    pub duration: Option<f64>,
    #[serde(rename = "webpage_url")]
    pub webpage_url: String,
    pub uploader: Option<String>,
    #[serde(rename = "upload_date")]
    pub upload_date: Option<String>,
    pub formats: Vec<VideoFormat>,
    #[serde(rename = "is_playlist")]
    pub is_playlist: Option<bool>,
    #[serde(rename = "playlist_title")]
    pub playlist_title: Option<String>,
    #[serde(rename = "playlist_id")]
    pub playlist_id: Option<String>,
    #[serde(rename = "playlist_index")]
    pub playlist_index: Option<i32>,
    #[serde(rename = "playlist_count")]
    pub playlist_count: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum TaskStatus {
    #[serde(rename = "pending")]
    Pending,
    #[serde(rename = "downloading")]
    Downloading,
    #[serde(rename = "completed")]
    Completed,
    #[serde(rename = "failed")]
    Failed,
    #[serde(rename = "cancelled")]
    Cancelled,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub title: String,
    pub status: TaskStatus,
    pub progress: f64,
    pub speed: String,
    pub eta: String,
    pub output_path: String,
    pub format_id: String,
    pub thumbnail: Option<String>,
    #[serde(rename = "is_playlist")]
    pub is_playlist: bool,
    #[serde(rename = "playlist_start")]
    pub playlist_start: Option<i32>,
    #[serde(rename = "playlist_end")]
    pub playlist_end: Option<i32>,
    #[serde(rename = "playlist_items")]
    pub playlist_items: Option<String>,
    #[serde(rename = "created_at")]
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DownloadProgress {
    pub task_id: String,
    pub percent: f64,
    pub speed: String,
    pub eta: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct DownloadStatus {
    pub task_id: String,
    pub status: TaskStatus,
    pub error: Option<String>,
}
