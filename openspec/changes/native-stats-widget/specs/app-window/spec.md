## MODIFIED Requirements

### Requirement: 主窗口加载 agentboard.cc
应用 SHALL 不再在启动时自动加载主窗口。主窗口改为调试用途，仅在以 `--debug` 参数启动时创建并加载 `https://agentboard.cc`，窗口初始尺寸为 1200×800，最小尺寸为 800×600。

#### Scenario: 正常启动不打开主窗口
- **WHEN** 用户正常启动应用（无 `--debug` 参数）
- **THEN** 系统不打开主窗口，直接启动 stats-widget

#### Scenario: 调试模式启动
- **WHEN** 用户以 `--debug` 参数启动应用
- **THEN** 系统打开主窗口并导航至 `https://agentboard.cc`

#### Scenario: 最小尺寸限制
- **WHEN** 用户拖拽窗口边缘缩小窗口
- **THEN** 窗口尺寸不得小于 800×600
