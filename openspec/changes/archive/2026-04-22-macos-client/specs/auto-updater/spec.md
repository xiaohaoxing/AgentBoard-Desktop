## ADDED Requirements

### Requirement: 启动时后台检查更新
应用启动时 SHALL 在后台静默检查是否有新版本（基于 GitHub Releases），不阻塞主界面加载。

#### Scenario: 启动时检查
- **WHEN** 应用启动
- **THEN** 后台发起版本检查请求，用户不感知到任何 UI 变化

### Requirement: 发现新版本时通知用户
检查到新版本时 SHALL 在菜单栏图标或应用菜单中显示提示，并通过原生通知告知用户。

#### Scenario: 有新版本可用
- **WHEN** 检查到新版本
- **THEN** 用户收到原生通知提示「AgentBoard 有新版本可用，点击更新」

### Requirement: 用户确认后下载并安装更新
用户点击更新提示 SHALL 触发后台下载，下载完成后提示用户重启应用完成安装。

#### Scenario: 用户确认更新
- **WHEN** 用户点击通知或菜单中的「安装更新」
- **THEN** 应用后台下载更新包，下载完成后弹出对话框提示「更新已就绪，点击重启安装」

#### Scenario: 用户拒绝重启
- **WHEN** 用户关闭重启提示
- **THEN** 更新包保留，下次启动时自动安装
