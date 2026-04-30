## ADDED Requirements

### Requirement: 趋势窗口入口按钮
Widget 标题栏 SHALL 包含一个"趋势"图标按钮，点击后打开趋势独立窗口，按钮不占用现有 Tab 栏空间。

#### Scenario: 点击趋势按钮打开窗口
- **WHEN** 用户点击 widget 标题栏的趋势图标按钮
- **THEN** 打开趋势独立窗口（800×540px），若窗口已存在则将其置于前台

#### Scenario: 趋势窗口已打开时再次点击
- **WHEN** 趋势窗口已打开且用户再次点击趋势按钮
- **THEN** 趋势窗口获得焦点并移至前台，不重复创建新窗口

### Requirement: 趋势独立窗口
趋势窗口 SHALL 是一个独立的 BrowserWindow，初始尺寸 800×540px，最小尺寸 640×400px，可调整大小，有原生标题栏（标题"用量趋势"）。

#### Scenario: 窗口初始尺寸
- **WHEN** 趋势窗口首次创建
- **THEN** 窗口尺寸为 800×540px，居中显示于主屏幕

#### Scenario: 窗口最小尺寸限制
- **WHEN** 用户拖拽调整窗口大小
- **THEN** 窗口尺寸不得小于 640×400px

#### Scenario: 关闭趋势窗口
- **WHEN** 用户点击趋势窗口的关闭按钮
- **THEN** 趋势窗口销毁，widget 中的趋势按钮恢复为未激活态

### Requirement: 时间范围切换器
趋势窗口工具栏 SHALL 提供"日 / 周 / 月"三段式切换控件，切换后图表数据实时更新。

#### Scenario: 默认展示周视图
- **WHEN** 用户首次打开趋势窗口
- **THEN** "周"选项处于选中状态，图表展示最近 7 天的数据

#### Scenario: 切换到日视图
- **WHEN** 用户点击"日"
- **THEN** 图表展示最近 24 小时（按小时分组）的 token 用量，X 轴刻度为小时

#### Scenario: 切换到月视图
- **WHEN** 用户点击"月"
- **THEN** 图表展示最近 30 天的 token 用量，X 轴刻度为日期

### Requirement: 折线图与柱形图切换
趋势窗口工具栏 SHALL 提供折线图和柱形图两种图表类型切换按钮，默认为折线图。

#### Scenario: 默认折线图
- **WHEN** 趋势窗口首次加载
- **THEN** 图表以折线图形式渲染，折线图按钮处于激活态

#### Scenario: 切换为柱形图
- **WHEN** 用户点击柱形图按钮
- **THEN** 图表立即以柱形图形式重新渲染，柱形图按钮激活

### Requirement: Canvas 图表渲染
图表 SHALL 基于 HTML Canvas 渲染，支持高 DPI 屏幕（Retina），适配 dark/light 主题，图表区域随窗口大小自适应。

#### Scenario: 高 DPI 清晰渲染
- **WHEN** 应用运行在 Retina（devicePixelRatio ≥ 2）屏幕上
- **THEN** Canvas 物理像素为逻辑尺寸的 devicePixelRatio 倍，图表线条清晰无模糊

#### Scenario: 深色主题适配
- **WHEN** 系统切换到深色模式
- **THEN** 图表背景、轴线、标签、数据线颜色均使用深色主题对应色值，无需重启

#### Scenario: 窗口调整大小时图表自适应
- **WHEN** 用户拖拽趋势窗口调整尺寸
- **THEN** Canvas 图表区域随窗口宽高自动重绘，充分利用可用空间

### Requirement: 数据悬停 Tooltip
鼠标悬停在图表数据点或柱形上时，SHALL 显示浮动 tooltip 展示该数据点的日期标签和 token 数量。

#### Scenario: 悬停折线图数据点
- **WHEN** 鼠标移动到折线图的某个数据点附近（命中半径 8px）
- **THEN** Tooltip 显示该点的时间标签和格式化后的 token 数量（如 "1.2M tokens"）

#### Scenario: 悬停柱形
- **WHEN** 鼠标移动到某个柱形区域内
- **THEN** Tooltip 显示该柱的时间标签和 token 数量

#### Scenario: 移出图表区域
- **WHEN** 鼠标移出图表 Canvas 区域
- **THEN** Tooltip 隐藏

### Requirement: 历史用量数据通过 IPC 获取
趋势窗口渲染进程 SHALL 通过 `get-usage-history` IPC 通道向主进程请求历史 token 数据，主进程返回时序数组。

#### Scenario: 请求日视图数据
- **WHEN** 渲染进程调用 `ipcRenderer.invoke('get-usage-history', { range: 'day' })`
- **THEN** 主进程返回 24 条 `{ label: string; tokens: number }` 数据，label 格式为 "HH:00"

#### Scenario: 请求周视图数据
- **WHEN** 渲染进程调用 `ipcRenderer.invoke('get-usage-history', { range: 'week' })`
- **THEN** 主进程返回 7 条数据，label 格式为 "MM/DD"

#### Scenario: 请求月视图数据
- **WHEN** 渲染进程调用 `ipcRenderer.invoke('get-usage-history', { range: 'month' })`
- **THEN** 主进程返回 30 条数据，label 格式为 "MM/DD"

#### Scenario: 后端不可用时降级为 mock 数据
- **WHEN** 网络请求失败或后端暂未上线
- **THEN** 主进程返回 mock 时序数据，渲染进程正常展示图表，控制台打印 warn 日志

### Requirement: Demo 模式 Mock 数据
Demo 模式下 (`--demo` 启动参数) SHALL 使用本地生成的 mock 时序数据展示趋势图表。

#### Scenario: Demo 模式下趋势图
- **WHEN** 应用以 `--demo` 参数启动并打开趋势窗口
- **THEN** 图表展示符合趋势规律的 mock 数据（非全零平线），用量数值与 demo 排行榜数据量级匹配

### Requirement: 趋势窗口汇总统计
趋势窗口顶部 SHALL 展示所选时间范围内的总 token 用量和日均/时均用量摘要信息。

#### Scenario: 周视图摘要
- **WHEN** 用户查看周视图
- **THEN** 窗口顶部显示"本周合计 X tokens，日均 Y tokens"

#### Scenario: 月视图摘要
- **WHEN** 用户查看月视图
- **THEN** 窗口顶部显示"本月合计 X tokens，日均 Y tokens"

#### Scenario: 日视图摘要
- **WHEN** 用户查看日视图
- **THEN** 窗口顶部显示"今日合计 X tokens，时均 Y tokens"
