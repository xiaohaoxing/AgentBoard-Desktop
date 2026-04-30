## ADDED Requirements

### Requirement: 发起认证 HTTP 请求
api-client SHALL 通过 Electron 主进程的 `net.request` 向 agentboard.cc API 发送请求，并自动携带持久化的 session cookie。

#### Scenario: 成功获取数据
- **WHEN** api-client 调用指定 endpoint
- **THEN** 返回解析后的 JSON 数据，调用方无需关心 cookie 注入细节

#### Scenario: 请求返回 401
- **WHEN** 服务端返回 HTTP 401
- **THEN** api-client 通过 IPC 发出 `auth:session-expired` 事件，触发重新登录流程

#### Scenario: 网络不可用
- **WHEN** 请求因网络错误失败
- **THEN** api-client 返回错误对象，包含 `type: 'network'` 字段，不抛出未捕获异常

### Requirement: 获取用量统计数据
api-client SHALL 提供 `fetchUsageStats()` 方法，返回当前登录用户的 AI 用量统计（含模型维度和时间维度）。

#### Scenario: 正常返回
- **WHEN** 调用 `fetchUsageStats()`
- **THEN** 返回包含各模型用量、总 token 数、时间范围的对象

### Requirement: 获取排行榜数据
api-client SHALL 提供 `fetchLeaderboard()` 方法，返回团队成员排行榜列表。

#### Scenario: 正常返回
- **WHEN** 调用 `fetchLeaderboard()`
- **THEN** 返回有序的成员列表，每项包含用户名和用量数值

### Requirement: 定时轮询刷新
api-client SHALL 支持以可配置间隔（默认 5 分钟）自动重新拉取数据，并通过 IPC 通知渲染层。

#### Scenario: 定时触发
- **WHEN** 距上次成功请求超过配置间隔
- **THEN** 自动发起新一轮请求，成功后通过 `stats:updated` IPC 事件推送最新数据

#### Scenario: 手动触发刷新
- **WHEN** 渲染层发出 `stats:refresh` IPC 事件
- **THEN** api-client 立即发起请求，无需等待下一个定时周期
