## MODIFIED Requirements

### Requirement: 菜单栏点击呼出窗口
点击菜单栏图标 SHALL 切换 stats-widget 的显示/隐藏状态（不再控制主窗口）。

#### Scenario: 点击图标显示 stats-widget
- **WHEN** stats-widget 处于隐藏状态，用户点击菜单栏图标
- **THEN** stats-widget 显示并获得焦点

#### Scenario: 点击图标隐藏 stats-widget
- **WHEN** stats-widget 处于显示且有焦点状态，用户点击菜单栏图标
- **THEN** stats-widget 隐藏

## MODIFIED Requirements

### Requirement: 菜单栏右键菜单
右键点击菜单栏图标 SHALL 弹出上下文菜单，包含：「显示 AgentBoard」、「检查更新」、「登出」、「退出」。

#### Scenario: 右键菜单显示
- **WHEN** 用户右键点击菜单栏图标
- **THEN** 弹出包含「显示 AgentBoard」「检查更新」「登出」「退出」的菜单

#### Scenario: 点击登出
- **WHEN** 用户在右键菜单中选择「登出」
- **THEN** 触发 auth-session 的登出流程，清除本地 session 并弹出登录窗口

#### Scenario: 点击退出
- **WHEN** 用户在右键菜单中选择「退出」
- **THEN** 应用完全退出
