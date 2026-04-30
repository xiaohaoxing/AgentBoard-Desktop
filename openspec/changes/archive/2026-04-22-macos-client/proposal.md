## Why

agentboard.cc 是一个基于浏览器的 AI Agent 管理面板，用户需要频繁切换标签页或记住网址才能访问。一个原生 macOS 客户端可以提供系统级集成（通知、菜单栏、快捷键），让用户随时快速访问 AgentBoard，提升日常工作效率。

## What Changes

- 新增 macOS 桌面应用程序，内嵌 agentboard.cc 网页内容
- 新增菜单栏图标（Menu Bar），一键呼出主窗口
- 新增 macOS 原生通知推送（Agent 状态变化、任务完成等）
- 新增应用自动更新机制
- 新增 Keychain 集成，安全存储用户认证 token

## Capabilities

### New Capabilities

- `app-window`: 主应用窗口，内嵌 agentboard.cc 的 WebView，支持窗口状态持久化（位置、尺寸）
- `menubar-integration`: 系统菜单栏图标，支持快速显示/隐藏主窗口及常用操作
- `native-notifications`: 订阅 agentboard.cc 的事件并通过 macOS 原生通知 API 推送给用户
- `auto-updater`: 应用版本检测与自动更新，支持后台静默下载、重启安装

### Modified Capabilities

<!-- 无既有 Capability 需变更 -->

## Impact

- 技术栈：Electron（Node.js + Chromium），TypeScript，使用 electron-builder 打包
- 需要 Apple Developer 证书进行代码签名与公证（Notarization）
- 构建产物：`.dmg` 安装包 + `mas` App Store 包（可选）
- 依赖：electron, electron-builder, electron-updater, electron-store
- agentboard.cc 网站需支持 `window.opener` 等跨环境兼容（无需后端改动，仅前端适配）
