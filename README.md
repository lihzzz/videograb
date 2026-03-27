# VideoGrab - macOS 视频下载器

基于 Tauri + React + yt-dlp 的 macOS 视频下载工具。

## 功能特性

- ✅ 支持 1000+ 视频网站 (YouTube, Bilibili 等)
- ✅ 实时预览视频信息 (标题、缩略图、时长)
- ✅ 多格式选择 (不同分辨率、文件大小)
- ✅ 实时下载进度显示
- ✅ 任务管理与取消
- ✅ 深色模式支持

## 技术栈

- **框架**: Tauri 2.x + React 18 + TypeScript
- **样式**: Tailwind CSS
- **状态管理**: Zustand
- **核心依赖**: yt-dlp

## 项目结构

```
videograb/
├── src/                          # React 前端
│   ├── components/              # UI 组件
│   │   ├── download/           # 下载相关组件
│   │   ├── common/             # 通用组件
│   │   └── layout/             # 布局组件
│   ├── stores/                 # Zustand 状态管理
│   ├── types/                  # TypeScript 类型
│   └── App.tsx                 # 根组件
├── src-tauri/                   # Rust 后端
│   ├── src/
│   │   ├── commands/           # Tauri 命令
│   │   ├── services/           # 业务服务
│   │   │   ├── ytdlp.rs       # yt-dlp 封装
│   │   │   └── downloader.rs  # 下载管理器
│   │   ├── models/             # 数据模型
│   │   └── main.rs             # 入口
│   ├── binaries/               # 内嵌二进制
│   │   └── yt-dlp             # yt-dlp 可执行文件
│   └── tauri.conf.json         # Tauri 配置
└── package.json
```

## 开发环境要求

- Node.js 18+
- Rust 1.70+
- macOS 10.15+

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 开发模式运行

```bash
npm run tauri:dev
```

### 3. 构建生产版本

```bash
npm run tauri:build
```

构建完成后，安装包位于 `src-tauri/target/release/bundle/`。

## 核心功能实现

### 视频解析

使用 yt-dlp 的 `--dump-json` 参数获取视频信息:

```bash
yt-dlp --dump-json --no-download <URL>
```

### 格式选择

过滤出同时包含视频和音频的格式，按分辨率分组展示。

### 下载进度

通过解析 yt-dlp 的标准输出实时获取进度:

```
[download] 45.2% of 100.00MiB at 12.5MiB/s ETA 00:30
```

### 任务管理

- Rust 后端维护下载任务队列
- 使用 Tokio 异步处理多个下载任务
- 通过 Tauri Event 实时推送进度到前端

## yt-dlp 更新

yt-dlp 更新频繁，建议定期检查更新:

```bash
curl -L -o src-tauri/binaries/yt-dlp \
  https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos
chmod +x src-tauri/binaries/yt-dlp
```

## 许可证

MIT
