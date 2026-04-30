## ADDED Requirements

### Requirement: 转发 Web Notification 至系统通知
当 agentboard.cc 页面调用 `window.Notification` API 时，主进程 SHALL 拦截并通过 macOS Notification Center 发送原生通知，即使主窗口处于后台或隐藏。

#### Scenario: 页面触发通知
- **WHEN** agentboard.cc 网页代码调用 `new Notification(title, options)`
- **THEN** 系统弹出 macOS 原生通知，显示 title 和 body

#### Scenario: 窗口隐藏时仍可收到通知
- **WHEN** 主窗口处于隐藏状态，agentboard.cc 发出通知事件
- **THEN** 用户仍然收到 macOS 原生通知

### Requirement: 首次启动请求通知权限
应用首次启动时 SHALL 请求 macOS 通知权限，并引导用户授权。

#### Scenario: 首次启动权限申请
- **WHEN** 用户首次启动应用
- **THEN** 系统弹出通知权限请求对话框

### Requirement: 点击通知呼出主窗口
用户点击 macOS 通知 SHALL 使主窗口显示并获得焦点。

#### Scenario: 点击通知
- **WHEN** 用户点击通知中心中的 AgentBoard 通知
- **THEN** 主窗口显示并获得焦点
