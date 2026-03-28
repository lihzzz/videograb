export interface VideoFormat {
  format_id: string;
  ext: string;
  format?: string;
  format_note?: string;
  resolution?: string;
  width?: number;
  height?: number;
  fps?: number;
  filesize?: number;
  filesize_approx?: number;
  tbr?: number;
  abr?: number;
  vcodec?: string;
  acodec?: string;
  quality?: number;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  uploader?: string;
  view_count?: number;
  channel?: string;
  playlist_count?: number;
  entries?: VideoInfo[];
}

export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  thumbnail?: string;
  uploader?: string;
  upload_date?: string;
  webpage_url: string;
  formats: VideoFormat[];
  is_playlist?: boolean;
  playlist_title?: string;
  playlist_id?: string;
  playlist_index?: number;
  playlist_count?: number;
}

export interface DownloadProgress {
  task_id: string;
  percent: number;
  speed: string;
  eta: string;
}

export interface DownloadTask {
  id: string;
  url: string;
  title: string;
  status: "pending" | "downloading" | "completed" | "failed" | "cancelled";
  progress: number;
  speed: string;
  eta: string;
  output_path: string;
  format_id: string;
  thumbnail?: string;
  created_at: number;
  error?: string;
  is_playlist?: boolean;
  playlist_title?: string;
  playlist_size?: number;
}
