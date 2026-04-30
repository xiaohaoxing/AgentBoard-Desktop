## Why

当前 widget 只展示实时排名快照，用户无法了解自己的用量随时间的变化趋势。widget 固定尺寸（320×520px）空间严重不足，无法呈现清晰的时序图表。因此以独立窗口形式实现趋势图，让用户在宽裕的可视区域内直观查看天/周/月维度的 token 消耗折线/柱形图，感知使用规律、发现高峰时段。

## What Changes

- 在 widget 标题栏新增**"趋势"图标按钮**，点击后打开独立的趋势窗口（800×540px）
- 新增趋势窗口，包含：
  - 顶部汇总统计（合计/均值）
  - 时间范围切换器（日 / 周 / 月）
  - 图表类型切换（折线 / 柱形）
  - 基于 Canvas 绘制的时序图，X 轴为时间刻度，Y 轴为 token 用量，鼠标悬停显示详细数值 tooltip
- 新增 `src/renderer/trend.html` + `src/renderer/trend.ts`（独立窗口渲染逻辑）
- 新增 `src/main/trendWindow.ts`（主进程窗口管理，单实例）
- 调用现有 `apiClient` 获取历史用量数据（新增 IPC 通道 `get-usage-history`）

## Capabilities

### New Capabilities

- `usage-trend-chart`: 独立窗口展示当前用户 token 用量的时序图表，支持折线/柱形切换和日/周/月范围切换

### Modified Capabilities

（无现有需求层变更）

## Impact

- **widget**：`src/renderer/widget.html`、`src/renderer/widget.ts` — 仅在标题栏新增一个图标按钮，其余不变
- **新文件**：`src/renderer/trend.html`、`src/renderer/trend.ts`、`src/main/trendWindow.ts`、`src/preload/trend.ts`
- **构建**：`package.json` build 脚本需复制 `trend.html` 到 `dist/renderer/`
- **API**：需要后端支持 `/api/usage/history?range=day|week|month`；暂未支持则降级 mock 数据
- **依赖**：无需引入外部图表库，使用原生 Canvas API 绘制
