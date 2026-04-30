## MODIFIED Requirements

### Requirement: 菜单栏右键菜单
右键点击菜单栏图标 SHALL 弹出上下文菜单，包含：「显示 AgentBoard / Show AgentBoard」、「检查更新 / Check for Updates」、「登出 / Log Out」、「退出 / Quit」；菜单文案随当前语言动态更新。

#### Scenario: 右键菜单显示
- **WHEN** 用户右键点击菜单栏图标
- **THEN** 弹出包含「显示 AgentBoard」「检查更新」「登出」「退出」的菜单，文案为当前语言

#### Scenario: 点击退出
- **WHEN** 用户在右键菜单中选择「退出 / Quit」
- **THEN** 应用完全退出

#### Scenario: 语言切换后菜单更新
- **WHEN** 用户切换语言后打开右键菜单
- **THEN** 所有菜单项文案显示为新语言

## ADDED Requirements

### Requirement: About 项目主页链接
应用的 About 对话框或菜单 SHALL 将项目主页链接指向 https://github.com/xiaohaoxing/AgentBoard-Desktop。

#### Scenario: About 链接正确
- **WHEN** 用户通过系统菜单打开 About
- **THEN** 显示的项目主页地址为 https://github.com/xiaohaoxing/AgentBoard-Desktop

### Requirement: 系统菜单包含 Settings 入口
系统应用菜单 SHALL 在 About 与 Quit 之间包含「Settings / 设置」菜单项。

#### Scenario: 菜单项存在于应用菜单
- **WHEN** 用户打开 macOS 菜单栏中的应用菜单
- **THEN** 看到「Settings」菜单项（位于分隔线后，Quit 之前）
