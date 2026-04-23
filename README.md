# AgentBoard-Desktop

macOS 菜单栏应用，实时显示 [agentboard.cc](https://agentboard.cc) 的个人与团队排行榜。

![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Electron](https://img.shields.io/badge/electron-30-blue)
![License](https://img.shields.io/badge/license-MIT-green)

[English](./README.en.md)

## 功能

- **实时排行榜** — 每分钟自动拉取最新数据，显示个人榜和团队榜
- **个人卡片** — 展示头像、用户名、Token 用量及增量、个人/团队排名及变化趋势
- **历史趋势** — 排名和 Token 增量向前追溯，找到最近一次实际变化的时间点
- **悬浮 Widget** — 始终置顶，可折叠收起，支持拖拽移动
- **菜单栏图标** — 显示当前排名，排名变化时短暂显示升降箭头
- **Magic Link 登录** — 支持在登录框粘贴 Magic Link / 回调 URL 完成认证
- **自动更新** — 通过 GitHub Releases 推送更新

## 截图

<p align="center">
  <img src="https://p.ipic.vip/a7zoxb.png" width="320" alt="中文界面" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://p.ipic.vip/9hwmio.png" width="320" alt="English UI" />
</p>
<p align="center">
  <sub>中文界面 &nbsp;&nbsp;·&nbsp;&nbsp; English UI</sub>
</p>

## 安装

### 下载预编译包

前往 [Releases](https://github.com/xiaohaoxing/AgentBoard-Desktop/releases) 下载最新的 `.dmg`，拖入 Applications 即可。

> **首次打开提示** — 由于应用未经 Apple 公证，macOS 会提示"无法验证开发者"。在 Finder 中**右键点击应用 → 打开 → 打开**即可绕过，后续正常启动无需重复操作。

### 从源码构建

**环境要求：** Node.js 20+、macOS

```bash
git clone https://github.com/xiaohaoxing/AgentBoard-Desktop.git
cd AgentBoard-Desktop
npm install
npm start
```

**打包为 `.dmg`：**

```bash
npm run make
```

产物在 `dist/` 目录下。

## 使用

1. 启动后弹出登录窗口，在 [agentboard.cc](https://agentboard.cc) 完成登录
2. 如果页面登录后未自动跳转，将浏览器地址栏中的回调 URL 粘贴到底部输入框
3. 登录成功后 Widget 自动出现在屏幕右下角

**快捷操作：**

| 操作 | 说明 |
|------|------|
| 点击菜单栏图标 | 显示 / 隐藏 Widget |
| 右键菜单栏图标 | 检查更新、登出、退出 |
| 点击刷新按钮 | 立即拉取最新数据 |
| 点击图钉按钮 | 切换始终置顶 |
| 点击折叠按钮 | 折叠为仅标题栏 |

## 项目结构

```
src/
├── main/
│   ├── index.ts          # 应用入口
│   ├── authSession.ts    # 登录窗口 & Cookie 认证
│   ├── apiClient.ts      # 数据拉取 & 排名历史
│   ├── statsWidget.ts    # 主 Widget 窗口
│   └── tray.ts           # 菜单栏图标
├── renderer/
│   ├── widget.html       # Widget UI
│   └── widget.ts         # Widget 渲染逻辑
└── preload/
    ├── widget.ts         # Widget IPC 桥接
    └── magiclink.ts      # Magic Link IPC 桥接
```

## 开发

```bash
npm run watch   # TypeScript 监听编译
npm run lint    # ESLint 检查
```

自动更新通过 `electron-updater` 对接 GitHub Releases。发布新版本：

```bash
npm run release
```

## License

MIT
