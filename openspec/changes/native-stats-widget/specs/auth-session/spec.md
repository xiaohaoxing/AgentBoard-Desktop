## ADDED Requirements

### Requirement: 首次启动引导登录
auth-session SHALL 在检测到无有效 session 时，弹出临时登录窗口加载 agentboard.cc，引导用户完成登录。

#### Scenario: 无 session 时启动
- **WHEN** 应用启动且本地无持久化 session
- **THEN** 弹出登录窗口（600×700），加载 `https://agentboard.cc/login`

#### Scenario: 登录成功检测
- **WHEN** 登录窗口的 URL 变更为非 `/login` 路径（表示登录成功）
- **THEN** 自动提取 session cookie，关闭登录窗口，触发 `auth:login-success` 事件

### Requirement: 持久化 session cookie
auth-session SHALL 使用 `electron-store` 加密存储 session cookie，应用重启后自动恢复。

#### Scenario: 持久化存储
- **WHEN** 登录成功获取到 cookie
- **THEN** cookie 被加密写入本地存储，下次启动无需重新登录

#### Scenario: 恢复 session
- **WHEN** 应用启动且本地存在有效 session
- **THEN** 直接跳过登录窗口，api-client 可立即使用该 session

### Requirement: Session 过期重新登录
auth-session SHALL 监听 `auth:session-expired` 事件，自动触发重新登录流程。

#### Scenario: 会话过期
- **WHEN** 收到 `auth:session-expired` 事件
- **THEN** 清除本地 session 并重新弹出登录窗口

### Requirement: 主动登出
auth-session SHALL 提供登出功能，清除本地 session 并重置应用状态。

#### Scenario: 用户登出
- **WHEN** 用户通过菜单触发登出
- **THEN** 清除本地存储中的 session，应用回到未登录状态并弹出登录窗口
