# VideoGrab 应用程序更新日志

## 新增功能：Cookies 支持

### 1. 功能概述
为了更好地支持需要身份验证的视频（如私有视频、年龄限制视频等），我们为 VideoGrab 应用添加了 cookies 支持功能。

### 2. 技术实现详情

#### 2.1 后端 (Rust)
- 在 `YtDlpService` 结构体中添加了 `cookies` 字段
- 实现了 `set_cookies` 和 `current_cookies` 方法
- 在 `fetch_video_info` 和 `start_download` 方法中添加了 `--cookies` 参数支持
- 添加了 `set_cookies_config` 命令处理器

#### 2.2 前端 (TypeScript/React)
- 添加了 `COOKIES_STORAGE_KEY` 本地存储键
- 扩展了 `downloadStore` 以管理 cookies 状态
- 添加了 `setCookies` 和 `syncCookiesConfig` 方法
- 实现了持久化 cookies 存储

#### 2.3 UI 组件
- 创建了 `CookiesConfig.tsx` 组件，提供 cookies 输入界面
- 更新了 `MainLayout.tsx` 以包含 cookies 配置区域
- 将 cookies 配置与代理配置并排显示在输入区域下方

### 3. 使用说明

#### 3.1 获取 YouTube Cookies
1. 登录 YouTube 网站
2. 使用浏览器扩展程序（如 Get Cookies.txt）导出 cookies
3. 保存为 Netscape 格式的 cookies.txt 文件
4. 在应用程序中输入文件路径或直接粘贴 cookies 内容

#### 3.2 使用方法
1. 在 Cookies 配置输入框中输入 cookies 文件路径或 cookies 内容
2. 点击"同步"按钮将配置应用到下载器
3. 使用正常流程添加视频 URL 并下载

### 4. 注意事项
- 请妥善保管 cookies 信息，不要分享给他人
- Cookies 可能会过期，需要定期更新
- 支持多种格式的 cookies，包括 Netscape 格式和 JSON 格式
- 可以与其他功能（如代理、播放列表、格式选择）结合使用

### 5. 与其他功能的整合
- 与播放列表功能完全兼容
- 与代理配置功能并存
- 与 yt-dlp 更新功能独立运作
- 支持播放列表的 cookies 验证

### 6. 预期解决的问题
- 私有视频访问问题
- 年龄限制视频访问问题
- 区域限制视频访问问题
- YouTube 频率限制问题（配合认证后通常会有更好的限制策略）

此功能的添加使得 VideoGrab 应用能够处理更多类型的视频内容，特别是那些需要用户认证才能访问的视频资源。