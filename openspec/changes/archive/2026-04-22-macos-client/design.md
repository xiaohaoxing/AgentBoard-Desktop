## Context

agentboard.cc 是一个 AI Agent 管理 Web 应用。当前用户只能通过浏览器访问，缺乏系统级集成。本项目基于 **Electron** 框架构建 macOS 原生桌面客户端，将 agentboard.cc 封装为原生应用，并扩展菜单栏入口、原生通知及自动更新能力。

项目从零开始（no existing code），目标平台：macOS 12+，TypeScript 全栈。

## Goals / Non-Goals

**Goals:**
- 用 Electron 封装 agentboard.cc，提供原生 macOS 窗口体验
- 菜单栏图标（Menu Bar Extra）支持一键呼出/隐藏窗口
- 利用 macOS Notification Center 发送 Agent 事件通知
- 应用内自动更新（GitHub Releases 作为更新源）
- 代码签名 + 公证（Notarization），支持 `.dmg` 分发

**Non-Goals:**
- iOS / iPadOS / Windows / Linux 支持
- 离线模式（所有功能依赖 agentboard.cc 网络连接）
- App Store 上架（MVP 阶段直接分发 `.dmg`）
- 重新实现 agentboard.cc 的业务逻辑

## Decisions

### D1: 框架选择 — Electron vs. Tauri

**选择：Electron**

| 维度 | Electron | Tauri |
|------|----------|-------|
| WebView | Chromium（与网站渲染一致） | WKWebView（可能有兼容差异） |
| 生态 | 成熟，npm 插件丰富 | 较新，部分功能需 Rust |
| Bundle 大小 | ~150 MB | ~10 MB |
| 开发速度 | 更快（纯 TS） | 需要 Rust 知识 |

选 Electron 主要原因：agentboard.cc 在 Chromium 下渲染一致性高；开发团队无 Rust 背景；生态更完善。

### D2: 主进程架构

主进程（`main/`）负责：窗口管理、菜单栏图标、通知、更新检测。
渲染进程通过 `contextBridge` + `ipcRenderer` 与主进程通信，严格禁用 `nodeIntegration`。

### D3: 通知实现方式

agentboard.cc 在 WebView 内通过 `window.Notification` API 触发通知时，主进程拦截并转发给 `Notification` native API，以获得系统通知权限。或通过 WebSocket/polling 监听后端事件，由主进程独立发送通知（不依赖页面是否可见）。

**选择：WebView 内 `Notification` 权限委托 + 主进程转发**（MVP 实现更简单，后续可扩展为 WebSocket 模式）。

### D4: 自动更新

使用 `electron-updater` + GitHub Releases，`.dmg` 包含 `latest-mac.yml` 签名文件。用户启动时后台检查更新，有新版本时在菜单栏 badge 提示，点击触发下载安装。

### D5: 认证 / Keychain

WebView 沿用 agentboard.cc 的 Cookie-based 会话，不另存 token。Electron 会话（`session.defaultSession`）持久化 Cookie，重启后自动登录。无需 Keychain 集成（MVP）。

## Risks / Trade-offs

- **WebView Cookie 清空** → 用户卸载重装后需重新登录；可接受，无额外处理
- **Chromium 版本滞后** → electron 固定的 Chromium 版本可能落后网站 CSS/JS；定期升级 electron 版本缓解
- **代码签名成本** → 需 Apple Developer 账号（$99/年）；项目初期可用 `--no-sign` 测试，正式发布必须签名
- **agentboard.cc CORS/CSP** → 若网站设置了严格 frame-ancestors，需在 Electron session 中设置适当的 `webRequest` 规则绕过（仅影响本地客户端，不影响安全性）
- **通知权限** → macOS 需用户明确授权通知权限；首次启动时需引导用户授权

## Migration Plan

1. 初始化 Electron 项目（`npm init electron-app`）
2. 配置 `electron-builder` 的 macOS 打包、签名、公证
3. 开发菜单栏图标、窗口管理
4. 接入 agentboard.cc WebView，处理导航、权限
5. 实现通知转发逻辑
6. 接入 `electron-updater`
7. CI（GitHub Actions）自动构建 + 发布 DMG

**Rollback**：应用为独立分发，每个版本 `.dmg` 独立存档，用户可降级安装旧版。

## Open Questions

- agentboard.cc 是否有 Desktop WebSocket/SSE 事件流可供主进程订阅（影响通知实现深度）？
- 菜单栏图标是否需要显示 Agent 运行数量 badge？
