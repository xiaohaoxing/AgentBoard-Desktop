## ADDED Requirements

### Requirement: 紧凑型浮动窗口
stats-widget SHALL 以独立 `BrowserWindow` 形式展示，默认尺寸 320×480，始终置顶，无原生标题栏。

#### Scenario: 应用启动
- **WHEN** 登录成功后应用完成初始化
- **THEN** stats-widget 窗口自动显示，位置为屏幕右下角，距边缘 16px

#### Scenario: 窗口拖拽
- **WHEN** 用户拖拽窗口标题区域
- **THEN** 窗口跟随鼠标移动，释放后位置持久化

### Requirement: 展示用量统计
stats-widget SHALL 在窗口顶部区域展示当前用户的 AI 用量统计数据。

#### Scenario: 数据加载完成
- **WHEN** api-client 通过 `stats:updated` 推送最新数据
- **THEN** 窗口显示各模型的 token 用量，以进度条或数字形式呈现

#### Scenario: 数据加载中
- **WHEN** 正在请求数据
- **THEN** 显示 loading 指示器，保留上次成功数据（若有）

#### Scenario: 数据获取失败
- **WHEN** api-client 返回网络错误
- **THEN** 保留上次数据并在窗口底部显示"数据可能过期"提示

### Requirement: 展示排行榜
stats-widget SHALL 在用量统计下方展示团队成员排行榜列表。

#### Scenario: 排行榜渲染
- **WHEN** 收到 leaderboard 数据
- **THEN** 按用量降序列出成员，每行显示排名、用户名、用量数值

#### Scenario: 当前用户高亮
- **WHEN** 排行榜中包含当前登录用户
- **THEN** 该行以高亮样式突出显示

### Requirement: 手动刷新
stats-widget SHALL 提供刷新按钮，点击后立即触发数据重新拉取。

#### Scenario: 点击刷新
- **WHEN** 用户点击刷新按钮
- **THEN** 向主进程发出 `stats:refresh` IPC 事件，按钮进入 loading 状态直到数据返回

### Requirement: 折叠/展开
stats-widget SHALL 支持折叠为仅显示标题栏的最小化状态（高度约 40px）。

#### Scenario: 折叠
- **WHEN** 用户点击折叠按钮
- **THEN** 窗口高度缩减至 40px，仅显示标题和展开按钮

#### Scenario: 展开
- **WHEN** 用户点击展开按钮
- **THEN** 窗口恢复至完整高度，展示所有数据
