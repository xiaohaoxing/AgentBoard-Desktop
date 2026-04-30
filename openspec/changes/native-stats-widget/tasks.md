## 1. API 接口发现

- [x] 1.1 创建调试窗口入口：在 `src/main/debugWindow.ts` 中实现 `createDebugWindow()`，加载 agentboard.cc 并开启 DevTools
- [x] 1.2 抓包记录用量统计接口：登录后在 Network 面板捕获用量统计相关 XHR/Fetch 请求，记录 endpoint、headers、response schema 到 `docs/api-discovery.md`
- [x] 1.3 抓包记录排行榜接口：同上，捕获排行榜数据接口并补充记录
- [x] 1.4 确认 session cookie 名称与作用域，记录到 `docs/api-discovery.md`

## 2. Auth Session 模块

- [x] 2.1 创建 `src/main/authSession.ts`，实现 `loadSession()` 从 `electron-store` 读取持久化 cookie
- [x] 2.2 实现 `saveSession(cookie: string)` 加密写入 cookie 到 `electron-store`
- [x] 2.3 实现 `clearSession()` 清除本地 session
- [x] 2.4 实现 `createLoginWindow()`：弹出 600×700 登录窗口加载 `https://agentboard.cc/login`
- [x] 2.5 监听登录窗口 URL 变化，检测登录成功（URL 不再含 `/login`），提取 cookie 并调用 `saveSession()`
- [x] 2.6 登录成功后关闭登录窗口，emit `auth:login-success`
- [x] 2.7 监听 `auth:session-expired` 事件，调用 `clearSession()` 并重新触发登录流程
- [x] 2.8 实现菜单「登出」逻辑：调用 `clearSession()` 并触发登录窗口

## 3. API Client 模块

- [x] 3.1 创建 `src/main/apiClient.ts`，封装 `request(endpoint, options)` 使用 `net.request` 发送请求并注入 session cookie
- [x] 3.2 实现 `fetchUsageStats()`：调用已发现的用量统计接口，返回标准化数据对象
- [x] 3.3 实现 `fetchLeaderboard()`：调用排行榜接口，返回有序成员列表
- [x] 3.4 处理 401 响应：检测后 emit `auth:session-expired`
- [x] 3.5 处理网络错误：捕获并返回 `{ type: 'network', message }` 对象，不抛出异常
- [x] 3.6 实现 `startPolling(intervalMs = 300000)`：定时调用 fetchUsageStats + fetchLeaderboard，成功后通过 IPC emit `stats:updated`
- [x] 3.7 监听渲染层 `stats:refresh` IPC 事件，立即触发一次拉取

## 4. Stats Widget 窗口

- [x] 4.1 创建 `src/main/statsWidget.ts`，实现 `createStatsWidget()`：无标题栏、alwaysOnTop、初始尺寸 320×480，位置固定在屏幕右下角距边缘 16px
- [x] 4.2 创建 `src/renderer/widget.html` + `src/renderer/widget.ts`：基础骨架结构（标题栏、用量区、排行榜区）
- [x] 4.3 实现拖拽移动：在标题栏区域启用 `-webkit-app-region: drag`，并持久化窗口位置
- [x] 4.4 渲染层监听 `stats:updated` IPC，将数据渲染到用量统计区域（进度条 + 数字）
- [x] 4.5 渲染层渲染排行榜列表，当前用户行高亮显示
- [x] 4.6 实现 loading 状态：请求中显示 spinner，保留上次数据
- [x] 4.7 实现「数据可能过期」提示：网络错误时在底部显示警告
- [x] 4.8 实现刷新按钮：点击 emit `stats:refresh`，进入 loading 直到 `stats:updated` 返回
- [x] 4.9 实现折叠/展开：折叠时窗口高度缩为 40px，展开恢复 480px，状态持久化

## 5. 主进程整合与菜单栏更新

- [x] 5.1 修改 `src/main/index.ts`：正常启动时不创建主窗口，改为启动 auth-session 检查 → 登录 → 创建 stats-widget → 启动轮询
- [x] 5.2 检测 `--debug` 参数：存在时额外调用 `createDebugWindow()`
- [x] 5.3 修改 `src/main/tray.ts`：点击菜单栏图标切换 stats-widget 显示/隐藏
- [x] 5.4 更新右键菜单：添加「登出」项，「显示 AgentBoard」改为控制 stats-widget

## 6. 样式与资源

- [x] 6.1 为 `widget.html` 编写紧凑 CSS：深色/浅色跟随系统，字体层级清晰
- [x] 6.2 实现当前用户排行榜高亮样式（背景色或左侧色块）
- [x] 6.3 更新 `tsconfig.json` 以包含 `src/renderer/` 目录

## 7. 验收测试

- [ ] 7.1 首次启动时弹出登录窗口，登录后自动关闭并显示 stats-widget
- [ ] 7.2 重启应用后无需重新登录，stats-widget 直接显示
- [ ] 7.3 stats-widget 正确展示用量统计和排行榜数据
- [ ] 7.4 手动刷新按钮触发数据重载，loading 状态正常显示
- [ ] 7.5 折叠/展开功能正常，状态跨重启持久化
- [ ] 7.6 菜单栏图标点击正确切换 stats-widget 显示/隐藏
- [ ] 7.7 右键菜单「登出」清除 session 并触发重新登录
- [ ] 7.8 `--debug` 参数启动时打开主窗口和 DevTools
