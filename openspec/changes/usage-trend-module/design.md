## Context

当前 AgentBoard Desktop widget（320×520px，Electron BrowserWindow）展示两个 Tab：用户榜、团队榜。数据通过 IPC 由主进程的 `apiClient.ts` 拉取，渲染层为 `widget.html` + `widget.ts`。

widget 固定宽 320px 的空间不足以展示有意义的时序图表（X 轴数据点过密、Y 轴标签被截断）。因此图表以独立 BrowserWindow 实现，与 widget 并行存在。

主进程通过 `electron-store` 缓存 rank 历史快照，但目前没有时序用量可视化。后端尚无历史用量时序 API，先以 mock 数据驱动开发。

约束：
- 不引入外部图表库（保持 bundle 体积不增长）
- 兼容 macOS dark/light mode（CSS 变量驱动）
- 趋势窗口可调整大小（初始 800×540px，最小 640×400px）

## Goals / Non-Goals

**Goals:**
- 新增独立趋势窗口，内嵌 Canvas 折线/柱形图，支持日/周/月三种时间范围
- 图表随窗口大小自适应重绘
- 图表支持 tooltip（鼠标悬停显示日期+用量数值）
- 兼容 demo 模式（mockData 生成时序数据）
- 适配 dark/light mode（从 CSS 变量读取颜色）
- widget 标题栏新增图标按钮作为入口，单实例打开

**Non-Goals:**
- 多用户对比图（仅展示当前登录用户自己的数据）
- 图表导出/截图功能
- 团队维度的趋势图（仅个人）
- 趋势窗口位置持久化（本期不做）

## Decisions

### 1. 独立 BrowserWindow，而非 widget 内嵌 Tab

**Selected**: 新建 `trendWindow.ts`，创建独立 `BrowserWindow`（800×540px，可调整大小）。  
**Alternatives**: 在 widget 内新增第三个 Tab，动态扩大 widget 高度。  
**Rationale**: widget 固定宽 320px，图表所需最低宽度约 500px；若扩大 widget 会破坏现有排行榜布局，且用户习惯将 widget 置于屏幕角落，过大的 widget 体验差。独立窗口可自由调整大小，互不干扰。

### 2. 不引入图表库，使用原生 Canvas API

**Selected**: 原生 `<canvas>` + TypeScript 手写渲染逻辑。  
**Alternatives**: Chart.js（~200KB），ECharts（~1MB）。  
**Rationale**: 静态 HTML 文件无 bundler，CDN 依赖违背离线场景；原生 Canvas 实现折线/柱形图约 150 行，可控。

### 3. 历史数据先走 mock，预留 IPC 通道

**Selected**: 新增 `get-usage-history` IPC 通道，主进程先返回 mock 数据；后续后端就绪替换实现。  
**Rationale**: 解耦前后端进度；IPC 接口固定后不需要再改 trend.html。

IPC 接口：
```
renderer → ipcRenderer.invoke('get-usage-history', { range: 'day' | 'week' | 'month' })
main     → returns UsagePoint[] = { label: string; tokens: number }[]
```

### 4. 单实例窗口管理

**Selected**: `trendWindow.ts` 维护模块级 `let trendWin: BrowserWindow | null`，`open-trend-window` IPC handler 中判断已存在则 `focus()`，否则新建。  
**Rationale**: 防止重复打开多个趋势窗口，符合 macOS 单文档窗口习惯。

### 5. 趋势窗口有独立 preload

**Selected**: 新建 `src/preload/trend.ts`，暴露 `getUsageHistory(range)` 到 contextBridge。  
**Rationale**: 趋势窗口与 widget 的 contextBridge API 职责不同，不共用 preload 避免污染。

### 6. Canvas 颜色从 CSS 变量读取，ResizeObserver 触发重绘

**Selected**: `getComputedStyle` 读取 CSS 变量；`ResizeObserver` 监听容器尺寸变化触发 canvas 重绘。  
**Rationale**: 颜色系统统一，尺寸自适应无需监听 `window.resize`（更精准）。

## Risks / Trade-offs

- **[Risk] 后端 API 延迟上线** → Mitigation: mock 降级 + warn 日志，用户无感知。
- **[Risk] Canvas 高 DPI 模糊** → Mitigation: 创建时检测 `devicePixelRatio`，放大物理像素后 CSS 缩回。
- **[Risk] 趋势窗口在 widget 销毁后仍存活** → Mitigation: widget 关闭时通过 `app.quit` 钩子一并关闭趋势窗口。
- **[Trade-off] 手写图表代码维护成本** → 可接受，逻辑简单，不依赖外部版本升级风险。
