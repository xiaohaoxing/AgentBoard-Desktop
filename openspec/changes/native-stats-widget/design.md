## Context

当前 AgentBoard Desktop 是对 `https://agentboard.cc` 的 WebView 套壳，不具备数据抓取能力。本次变更目标是通过逆向工程（DevTools 抓包）找到 agentboard.cc 的 REST 接口，在本地用 Electron 原生窗口渲染用量统计与排行榜，彻底摆脱 WebView 依赖。

## Goals / Non-Goals

**Goals:**
- 通过 DevTools/网络抓包发现并记录 agentboard.cc 的 API 接口
- 实现携带认证的 HTTP 请求模块（api-client）
- 实现轻量登录态管理（auth-session），支持首次引导登录
- 实现紧凑型 Stats Widget 窗口，展示用量统计和排行榜

**Non-Goals:**
- 不实现完整的 agentboard.cc 功能（写操作、配置管理等）
- 不在本地实现完整 UI 组件库，仅实现 Widget 所需视图
- 不支持多账号同时登录

## Decisions

### 1. API 发现策略：DevTools 抓包 + 本地文档化

在 Electron 中打开 agentboard.cc 的调试 WebView，启用 `devTools` 捕获所有 XHR/Fetch 请求，提取 endpoint、headers、response schema，记录到 `docs/api-discovery.md`。

**替代方案考虑：** 直接阅读前端 JS 源码 — 成本过高，minified 代码难以阅读；抓包更直接。

### 2. 认证方案：一次性登录 WebView + Cookie 持久化

首次启动时弹出一个临时登录窗口加载 agentboard.cc，登录成功后提取 session cookie，用 `electron-store` 加密持久化。后续请求通过 `net.request` 携带该 cookie。

**替代方案考虑：** 要求用户手动粘贴 API Token — UX 差，agentboard.cc 不一定暴露 token；WebView 登录对用户透明。

### 3. Widget 渲染：本地 HTML/CSS（无前端框架）

Stats Widget 是一个独立 `BrowserWindow`，加载本地 `dist/renderer/widget.html`，通过 IPC 从主进程接收数据并渲染。不引入 React/Vue 等框架，保持轻量。

**替代方案考虑：** 引入 React — 增加打包体积；数据展示场景简单，原生 DOM 操作足够。

### 4. 数据轮询：定时器 + 手动刷新

默认每 5 分钟调用 API 刷新数据，Widget 提供手动刷新按钮。刷新时显示 loading 态。

**替代方案考虑：** WebSocket 实时推送 — agentboard.cc 未必支持；轮询成本低且足够。

## Risks / Trade-offs

- **[风险] API 为私有接口，随时可能变更** → 版本号或 response schema 变更时客户端静默失败；缓存上次成功数据并提示"数据可能过期"
- **[风险] Session Cookie 过期** → auth-session 模块检测 401 后自动触发重新登录流程
- **[风险] agentboard.cc 添加 CORS/CSP 限制** → 使用 Electron `net.request`（主进程发起，绕过 CORS）而非渲染层 fetch

## Migration Plan

1. 保留 `src/main/window.ts` 作为可选调试窗口（不默认启动）
2. 新增 `statsWidget` 作为默认启动窗口
3. 菜单栏点击事件切换到 `statsWidget`
4. 老的 WebView 加载逻辑可通过 `--debug` 启动参数激活

## Open Questions

- agentboard.cc 的用量统计接口路径待抓包确认
- 排行榜数据维度（按 token、按请求数、按模型）待确认
- Widget 是否需要支持「点击穿透」模式（鼠标事件透传到下层窗口）
