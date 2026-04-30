## ADDED Requirements

### Requirement: 主窗口加载 agentboard.cc
应用启动后 SHALL 创建主窗口并加载 `https://agentboard.cc`，窗口初始尺寸为 1200×800，最小尺寸为 800×600。

#### Scenario: 应用启动加载页面
- **WHEN** 用户启动应用
- **THEN** 系统打开主窗口并导航至 `https://agentboard.cc`

#### Scenario: 最小尺寸限制
- **WHEN** 用户拖拽窗口边缘缩小窗口
- **THEN** 窗口尺寸不得小于 800×600

### Requirement: 窗口状态持久化
应用 SHALL 在退出前保存主窗口的位置与尺寸，下次启动时恢复。

#### Scenario: 位置恢复
- **WHEN** 用户调整窗口位置后退出，然后重新启动
- **THEN** 窗口出现在上次关闭时的位置和尺寸

### Requirement: 关闭窗口行为
在 macOS 上，点击红色关闭按钮 SHALL 隐藏窗口（而非退出应用），应用保持在 Dock 中运行。

#### Scenario: 点击关闭按钮
- **WHEN** 用户点击主窗口的关闭按钮（红色）
- **THEN** 窗口隐藏，但应用进程继续运行，Dock 图标保留

#### Scenario: Cmd+Q 退出
- **WHEN** 用户按下 Cmd+Q 或选择菜单「AgentBoard → 退出」
- **THEN** 应用完全退出

### Requirement: 外部链接在浏览器中打开
WebView 内点击指向外部域名的链接 SHALL 在系统默认浏览器中打开，而非在应用内导航。

#### Scenario: 点击外部链接
- **WHEN** 用户在 WebView 内点击跳转至非 agentboard.cc 域名的链接
- **THEN** 系统默认浏览器打开该链接，WebView 不发生导航
