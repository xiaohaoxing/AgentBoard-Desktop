## 1. 项目初始化

- [x] 1.1 使用 `npm init electron-app@latest agentboard-desktop -- --template=webpack-typescript` 初始化 Electron + TypeScript 项目
- [x] 1.2 安装核心依赖：`electron-store`（窗口状态持久化）、`electron-updater`（自动更新）
- [x] 1.3 配置 `electron-builder`：设置 appId、productName、macOS 目标（dmg + zip）、entitlements
- [x] 1.4 创建目录结构：`src/main/`（主进程）、`src/preload/`（预加载脚本）、`src/renderer/`（渲染层）
- [x] 1.5 配置 TypeScript strict 模式和 ESLint

## 2. 主窗口（app-window）

- [x] 2.1 在 `src/main/window.ts` 中创建 `createMainWindow()` 函数，设置初始尺寸 1200×800、最小尺寸 800×600
- [x] 2.2 使用 `electron-store` 持久化窗口位置和尺寸，启动时恢复
- [x] 2.3 加载 `https://agentboard.cc`，配置 `webPreferences`：`nodeIntegration: false`、`contextIsolation: true`、`sandbox: true`
- [x] 2.4 实现 `close` 事件处理：`event.preventDefault()` + `win.hide()`（隐藏而非退出）
- [x] 2.5 注册 `will-navigate` 和 `new-window` 事件，将外部域名链接转发至 `shell.openExternal()`
- [x] 2.6 实现 Cmd+Q 应用菜单项，调用 `app.quit()`

## 3. 菜单栏集成（menubar-integration）

- [x] 3.1 在 `src/main/tray.ts` 中创建 `Tray` 实例，加载 `trayTemplate.png`（16×16 模板图）
- [x] 3.2 实现左键点击事件：切换主窗口显示/隐藏（`win.isVisible()` 判断）
- [x] 3.3 构建右键菜单：「显示 AgentBoard」、「检查更新」、分割线、「退出」
- [x] 3.4 「显示 AgentBoard」点击后调用 `win.show()` + `win.focus()`
- [x] 3.5 设计并导出 `trayTemplate@2x.png`（32×32）菜单栏图标资源

## 4. 原生通知（native-notifications）

- [x] 4.1 在 `src/preload/index.ts` 中覆写 `window.Notification`，通过 `ipcRenderer.send('notification', {...})` 转发至主进程
- [x] 4.2 在主进程中监听 `notification` IPC 事件，使用 Electron `Notification` API 发送系统通知
- [x] 4.3 应用 `ready` 后调用 `Notification.requestPermission()` 申请 macOS 通知权限
- [x] 4.4 通知 `click` 事件触发 `win.show()` + `win.focus()`

## 5. 自动更新（auto-updater）

- [x] 5.1 在 `src/main/updater.ts` 中初始化 `autoUpdater`，配置 GitHub Releases 作为更新源（`autoUpdater.setFeedURL`）
- [x] 5.2 应用 `ready` 后延迟 5s 调用 `autoUpdater.checkForUpdatesAndNotify()`
- [x] 5.3 监听 `update-available` 事件，发送原生通知「AgentBoard 有新版本可用，点击更新」
- [x] 5.4 监听 `update-downloaded` 事件，弹出 `dialog.showMessageBox` 提示重启安装
- [x] 5.5 菜单栏右键「检查更新」触发手动 `autoUpdater.checkForUpdates()`
- [x] 5.6 在 `electron-builder` 配置中添加 `publish` 配置（provider: github）

## 6. 打包与发布

- [x] 6.1 配置代码签名环境变量（`CSC_LINK`、`CSC_KEY_PASSWORD`、`APPLE_ID` 等）用于 CI
- [x] 6.2 添加 `entitlements.mac.plist`：启用 `com.apple.security.network.client`、`com.apple.security.cs.allow-jit`
- [x] 6.3 创建 GitHub Actions workflow（`.github/workflows/release.yml`）：push tag 时自动构建并发布 DMG 到 GitHub Releases
- [ ] 6.4 本地执行 `npm run make` 验证 `.dmg` 产物可安装运行

## 7. 测试与验收

- [ ] 7.1 验证主窗口加载 agentboard.cc 并可正常登录使用
- [ ] 7.2 验证关闭按钮隐藏窗口、Cmd+Q 退出应用
- [ ] 7.3 验证窗口位置和尺寸跨重启持久化
- [ ] 7.4 验证菜单栏图标显示/隐藏窗口功能
- [ ] 7.5 验证外部链接在默认浏览器中打开
- [ ] 7.6 通过 `osascript` 或 `terminal-notifier` 手动触发通知，验证通知转发
- [ ] 7.7 验证自动更新流程（使用测试 release tag）
