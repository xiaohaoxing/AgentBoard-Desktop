## 1. IPC 数据通道

- [x] 1.1 在 `src/main/apiClient.ts` 中定义 `UsagePoint` 类型和 `UsageHistoryRequest` 接口
- [x] 1.2 在 `src/main/mockData.ts` 中实现 `getDemoUsageHistory(range)` 函数，生成日/周/月 mock 时序数据
- [x] 1.3 在 `src/main/index.ts` 注册 `get-usage-history` IPC handler，demo 模式返回 mock 数据，生产模式调用后端接口（暂时降级为 mock + warn 日志）
- [x] 1.4 在 `src/main/index.ts` 注册 `open-trend-window` IPC handler，调用 `trendWindow.openTrendWindow()`

## 2. 主进程趋势窗口管理

- [x] 2.1 新建 `src/main/trendWindow.ts`，导出 `openTrendWindow()` 函数
- [x] 2.2 实现单实例逻辑：若窗口已存在则 `focus()`，否则创建 800×540px BrowserWindow（最小 640×400px，可调整大小）
- [x] 2.3 窗口 `webPreferences` 指定 `preload: trend.js`，加载 `trend.html`
- [x] 2.4 监听窗口 `closed` 事件，将模块级引用置 null

## 3. Preload

- [x] 3.1 新建 `src/preload/trend.ts`，通过 `contextBridge` 暴露 `getUsageHistory(range)` 方法（调用 `ipcRenderer.invoke('get-usage-history', { range })`）
- [x] 3.2 在 `tsconfig.json` 或构建脚本中确认 `preload/trend.ts` 被编译到 `dist/preload/trend.js`

## 4. 趋势窗口 HTML 结构

- [x] 4.1 新建 `src/renderer/trend.html`，包含：顶部汇总区 `#summary`、工具栏（分段控件 + 图表类型按钮）`#toolbar`、图表容器 `#chart-container` + `<canvas id="chart">`、tooltip `#tooltip`
- [x] 4.2 在 `trend.html` 内联 CSS：定义 CSS 变量（与 widget.html 保持一致的 light/dark 变量）、工具栏布局、分段控件样式、summary 文字样式
- [x] 4.3 在 `package.json` build 脚本中添加 `cp src/renderer/trend.html dist/renderer/trend.html`

## 5. 图表渲染逻辑（Canvas）

- [x] 5.1 新建 `src/renderer/trend.ts`，创建 `TrendChart` 类，构造函数接收 canvas 元素
- [x] 5.2 实现高 DPI 初始化逻辑（`devicePixelRatio` 适配）
- [x] 5.3 实现 `renderLine(data: UsagePoint[])` 方法：绘制 X/Y 轴、网格线、折线、数据点
- [x] 5.4 实现 `renderBar(data: UsagePoint[])` 方法：绘制 X/Y 轴、网格线、柱形
- [x] 5.5 实现 Y 轴刻度自动计算（取最大值，向上取整至友好刻度，显示 3-4 条网格线）
- [x] 5.6 实现 X 轴标签精简显示（日视图显示 6 个时间点，周/月视图显示 5-7 个日期标签）
- [x] 5.7 用 `ResizeObserver` 监听 `#chart-container` 尺寸变化，调整 canvas 物理像素并重绘
- [x] 5.8 实现 `matchMedia` 监听器，主题切换时重新读取 CSS 变量并重绘

## 6. Tooltip 交互

- [x] 6.1 在 canvas 上注册 `mousemove` 事件，计算命中数据点（折线：半径 8px；柱形：列范围）
- [x] 6.2 命中时定位并显示 `#tooltip`，内容为时间标签 + 格式化 token 数（如 "1.2M tokens"）
- [x] 6.3 注册 `mouseleave` 事件隐藏 tooltip

## 7. 窗口逻辑与状态管理

- [x] 7.1 页面加载后默认请求"周"视图数据并渲染图表、更新摘要文字
- [x] 7.2 实现时间范围切换（日/周/月）：调用 `getUsageHistory`、更新摘要、重绘图表
- [x] 7.3 实现图表类型切换（折线/柱形）：切换按钮激活态、用当前数据重绘
- [x] 7.4 实现 `#summary` 文字计算（合计 tokens、日均/时均）并格式化显示（如 "3.2M"）

## 8. Widget 入口按钮

- [x] 8.1 在 `src/renderer/widget.html` 标题栏新增趋势图标按钮 `#btn-trend`
- [x] 8.2 在 `src/renderer/widget.ts` 中为 `#btn-trend` 注册点击事件，调用 `ipcRenderer.send('open-trend-window')`
- [x] 8.3 在 `src/preload/widget.ts` 暴露 `openTrendWindow()` 方法（send 版，无需返回值）

## 9. 验证

- [ ] 9.1 以 `--demo` 模式启动，验证点击趋势按钮可打开独立窗口、图表正常渲染（折线/柱形均有数据）
- [ ] 9.2 重复点击趋势按钮，验证不会创建多个窗口（只置前台）
- [ ] 9.3 切换日/周/月，验证图表数据和 X 轴标签随之变化、摘要文字同步更新
- [ ] 9.4 拖拽调整窗口大小，验证图表自适应重绘，不变形
- [ ] 9.5 验证 Retina 屏下图表清晰无模糊
- [ ] 9.6 手动切换系统深色/浅色模式，验证图表颜色正确更新
- [ ] 9.7 验证悬停 tooltip 在折线/柱形两种模式下均正常显示和隐藏
- [ ] 9.8 验证关闭趋势窗口后 widget 功能无回归，再次点击按钮可重新打开
