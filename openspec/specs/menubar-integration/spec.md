## ADDED Requirements

### Requirement: 菜单栏图标常驻
应用运行时 SHALL 在 macOS 菜单栏（右侧）显示 AgentBoard 图标，即使主窗口隐藏也保持可见。

#### Scenario: 图标常驻
- **WHEN** 应用启动
- **THEN** 菜单栏右侧出现 AgentBoard 图标

### Requirement: 菜单栏点击呼出窗口
点击菜单栏图标 SHALL 切换主窗口的显示/隐藏状态。

#### Scenario: 点击图标显示窗口
- **WHEN** 主窗口处于隐藏状态，用户点击菜单栏图标
- **THEN** 主窗口显示并获得焦点

#### Scenario: 点击图标隐藏窗口
- **WHEN** 主窗口处于显示且有焦点状态，用户点击菜单栏图标
- **THEN** 主窗口隐藏

### Requirement: 菜单栏右键菜单
右键点击菜单栏图标 SHALL 弹出上下文菜单，包含：「显示 AgentBoard」、「检查更新」、「退出」。

#### Scenario: 右键菜单显示
- **WHEN** 用户右键点击菜单栏图标
- **THEN** 弹出包含「显示 AgentBoard」「检查更新」「退出」的菜单

#### Scenario: 点击退出
- **WHEN** 用户在右键菜单中选择「退出」
- **THEN** 应用完全退出
