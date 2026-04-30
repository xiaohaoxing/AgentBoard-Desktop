## Why

当前客户端是对 agentboard.cc 的简单 WebView 套壳，无法提供原生桌面体验，也无法实现轻量化的常驻状态展示。用户需要的是一个始终可见的小窗口，快速查看 AI 用量统计与团队排行榜，而不是打开完整网页。

## What Changes

- 移除 WebView 套壳方式（不再直接加载 agentboard.cc）
- 新增 API 客户端模块，调用 agentboard.cc 的接口抓取数据（用量统计、排行榜）
- 新增 Auth Session 模块，管理登录态（Cookie/Token），支持用户在首次使用时完成认证
- 新增 Stats Widget 窗口：紧凑型浮动小窗口，展示用量统计与排行榜，常驻桌面

## Capabilities

### New Capabilities

- `api-client`: 调用 agentboard.cc REST 接口，携带认证信息，获取用量统计与排行榜数据；支持定时轮询刷新
- `auth-session`: 管理 agentboard.cc 的登录态；首次启动引导用户登录（内嵌登录 WebView 或 Token 输入），持久化 session 供 api-client 使用
- `stats-widget`: 紧凑型浮动窗口（约 320×480），展示当前用量（按模型/时间维度）和团队排行榜；支持展开/折叠、点击穿透可选

### Modified Capabilities

- `app-window`: 主窗口角色由"全屏 WebView"改为"可选的调试窗口"，stats-widget 成为主要交互入口
- `menubar-integration`: 菜单栏点击行为改为切换 stats-widget（而非原来的主窗口）

## Impact

- `src/main/window.ts`：降级为调试用途，不再是默认启动窗口
- `src/main/tray.ts`：点击事件指向 stats-widget
- 新增 `src/main/apiClient.ts`、`src/main/authSession.ts`、`src/main/statsWidget.ts`
- 新增依赖：需要解析 agentboard.cc 的接口（通过 DevTools 抓包分析）
- 移除对 `https://agentboard.cc` 直接加载的依赖
