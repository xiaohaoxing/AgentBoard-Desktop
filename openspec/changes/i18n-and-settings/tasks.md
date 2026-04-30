## 1. i18n 模块

- [x] 1.1 新建 `src/main/i18n.ts`，定义 `Locale = 'zh' | 'en'`、字符串资源对象（zh/en 各一份），实现 `t(key)` 翻译函数（含缺失键降级逻辑）
- [x] 1.2 在 `i18n.ts` 中用 `electron-store` 持久化语言偏好，默认 `zh`；导出 `getLocale()` / `setLocale(locale)` / `onLocaleChange(cb)`
- [x] 1.3 补全所有中英文翻译键（覆盖 widget、magiclink、tray、settings 的全部文案）

## 2. 设置窗口

- [x] 2.1 新建 `src/renderer/settings.html`，包含语言选择控件（单选：中文 / English）及当前选中状态，样式与 widget 一致
- [x] 2.2 新建 `src/preload/settings.ts`，暴露 `settingsApi.getLocale()` / `settingsApi.setLocale(locale)` / `settingsApi.onLocaleChange(cb)` IPC 桥接
- [x] 2.3 新建 `src/main/settingsWindow.ts`，实现 `openSettingsWindow()` 单例窗口（360×240，`resizable: false`），加载 `settings.html`；窗口关闭时置 null
- [x] 2.4 在 `settingsWindow.ts` 监听 `settings:set-locale` IPC，调用 `setLocale()` 并向所有 webContents 广播 `i18n:changed`
- [x] 2.5 在 `package.json` build 脚本中追加 `settings.html` 的 `cp` 命令

## 3. 系统菜单更新

- [x] 3.1 在 `src/main/index.ts` 的应用菜单中，在 About 后添加分隔线和「Settings」菜单项，点击调用 `openSettingsWindow()`
- [x] 3.2 将 About 菜单项替换为自定义实现，将项目主页链接设为 `https://github.com/xiaohaoxing/AgentBoard-Desktop`（使用 `app.setAboutPanelOptions`）
- [x] 3.3 在 `index.ts` 监听 `i18n:changed` 事件，重建应用菜单（菜单文案随语言更新）

## 4. Widget 国际化

- [x] 4.1 在 `src/preload/widget.ts` 暴露 `widgetApi.onLocaleChange(cb)` 和 `widgetApi.t(key)` 供渲染进程使用
- [x] 4.2 为 `src/renderer/widget.html` 中所有文案节点添加 `data-i18n="<key>"` 属性
- [x] 4.3 在 `src/renderer/widget.ts` 实现 `applyLocale()` 函数，遍历 `[data-i18n]` 节点批量替换文本；在 `onLocaleChange` 回调中调用

## 5. 其他界面国际化

- [x] 5.1 更新 `src/renderer/magiclink.html` 文案节点添加 `data-i18n` 属性，新建对应 preload/renderer 逻辑（或 inline script 直接从 IPC 获取翻译）
- [x] 5.2 更新 `src/main/tray.ts`，右键菜单文案通过 `t(key)` 读取；监听 `i18n:changed` 重建 contextMenu
- [x] 5.3 更新 `src/main/authSession.ts` 中的登录窗口标题通过 `t(key)` 读取

## 6. 构建验证

- [x] 6.1 运行 `npm run build`，确认无 TypeScript 错误
- [ ] 6.2 启动应用，验证默认中文显示正确
- [ ] 6.3 打开设置，切换为英文，验证所有界面实时更新
- [ ] 6.4 重启应用，验证语言偏好保持为英文
- [ ] 6.5 验证 About 面板显示正确的项目主页链接
