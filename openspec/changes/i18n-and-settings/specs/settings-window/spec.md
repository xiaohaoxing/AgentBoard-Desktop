## ADDED Requirements

### Requirement: 设置窗口入口
系统 SHALL 在系统应用菜单（macOS 菜单栏）中提供「Settings / 设置」菜单项，点击后打开设置窗口。

#### Scenario: 菜单项存在
- **WHEN** 用户打开系统菜单
- **THEN** 菜单中包含「Settings」（英文）或「设置」（中文）菜单项

#### Scenario: 点击打开设置窗口
- **WHEN** 用户点击「设置」菜单项
- **THEN** 打开设置窗口并获得焦点

#### Scenario: 窗口单例
- **WHEN** 设置窗口已打开，用户再次点击「设置」菜单项
- **THEN** 聚焦已有窗口，不创建新窗口

### Requirement: 语言切换控件
设置窗口 SHALL 提供语言选择控件，列出所有支持的语言（中文、English），并标示当前所选语言。

#### Scenario: 显示当前语言
- **WHEN** 设置窗口打开
- **THEN** 当前语言对应的选项处于选中状态

#### Scenario: 切换语言
- **WHEN** 用户选择另一种语言
- **THEN** 语言偏好保存，所有窗口文案立即更新为新语言
