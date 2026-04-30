## Why

AgentBoard Desktop 目前硬编码中文界面，无法面向国际用户使用；同时缺少统一的设置入口，语言等偏好无处配置。随着项目开源发布，需要提供中英双语支持和基础设置页面。

## What Changes

- 新增 i18n 模块，支持中文（默认）和英文两种语言，所有界面文案通过翻译键读取
- 新增「设置」菜单项（系统菜单 → Settings），打开设置窗口
- 设置窗口包含语言切换（中文 / English），切换后实时生效
- 更新 About 对话框的项目主页链接为 https://github.com/xiaohaoxing/AgentBoard-Desktop

## Capabilities

### New Capabilities

- `i18n`: 国际化模块，维护中英两套字符串资源，提供翻译函数，持久化当前语言选择
- `settings-window`: 系统菜单中的设置窗口，提供语言切换 UI，变更后向所有渲染进程广播

### Modified Capabilities

- `menubar-integration`: 系统菜单新增 Settings 菜单项，About 链接改为个人项目主页

## Impact

- **新增文件**：`src/main/i18n.ts`、`src/renderer/settings.html`、`src/preload/settings.ts`
- **修改文件**：`src/main/index.ts`（菜单重建、About 链接）、`src/renderer/widget.html`/`widget.ts`（文案替换为 i18n 键）、`src/renderer/magiclink.html`（文案替换）、`src/main/tray.ts`（菜单文案替换）
- **依赖变化**：无新增运行时依赖，语言偏好通过 `electron-store` 持久化
