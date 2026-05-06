# AgentBoard-Desktop

A macOS menu bar app that displays your personal and team rankings on [agentboard.cc](https://agentboard.cc) in real time.

[![Release](https://github.com/xiaohaoxing/AgentBoard-Desktop/actions/workflows/release.yml/badge.svg)](https://github.com/xiaohaoxing/AgentBoard-Desktop/actions/workflows/release.yml)
[![GitHub release](https://img.shields.io/github/v/release/xiaohaoxing/AgentBoard-Desktop)](https://github.com/xiaohaoxing/AgentBoard-Desktop/releases)
[![GitHub Downloads](https://img.shields.io/github/downloads/xiaohaoxing/AgentBoard-Desktop/total)](https://github.com/xiaohaoxing/AgentBoard-Desktop/releases)
![Platform](https://img.shields.io/badge/platform-macOS-lightgrey)
![Electron](https://img.shields.io/badge/electron-30-blue)
![License](https://img.shields.io/badge/license-MIT-green)

[中文](./README.md)

## Features

- **Live leaderboard** — auto-refreshes every minute, showing both personal and team rankings
- **Personal card** — displays avatar, username, token usage with delta, and rank trends for both individual and team
- **Historical trends** — traces rank and token changes back to the last actual movement
- **Floating widget** — always on top, collapsible, and draggable
- **Menu bar icon** — shows your current rank; briefly animates up/down arrows when your rank changes
- **Magic Link login** — paste a Magic Link or callback URL directly into the login bar to authenticate
- **Auto-update** — delivers updates via GitHub Releases

## Screenshots

<p align="center">
  <img src="https://p.ipic.vip/a7zoxb.png" width="320" alt="Chinese UI" />
  &nbsp;&nbsp;&nbsp;&nbsp;
  <img src="https://p.ipic.vip/9hwmio.png" width="320" alt="English UI" />
</p>
<p align="center">
  <sub>Chinese UI &nbsp;&nbsp;·&nbsp;&nbsp; English UI</sub>
</p>

## Installation

### Download a pre-built binary

Go to [Releases](https://github.com/xiaohaoxing/AgentBoard-Desktop/releases), download the latest `.dmg`, and drag it into Applications.

> **First launch warning** — Because the app is not notarized by Apple, macOS will show an "unidentified developer" prompt.
> Input the command in terminal

``` bash
sudo xattr -d com.apple.quarantine /Applications/AgentBoard.app
```

### Build from source

**Requirements:** Node.js 20+, macOS

```bash
git clone https://github.com/xiaohaoxing/AgentBoard-Desktop.git
cd AgentBoard-Desktop
npm install
npm start
```

**Package as `.dmg`:**

```bash
npm run make
```

Output is placed in the `dist/` directory.

## Usage

1. A login window appears on first launch — complete sign-in at [agentboard.cc](https://agentboard.cc)
2. If the page does not redirect automatically after login, copy the callback URL from your browser and paste it into the input bar at the bottom of the login window
3. Once authenticated, the widget appears in the bottom-right corner of your screen

**Quick actions:**

| Action | Description |
|--------|-------------|
| Click menu bar icon | Show / hide the widget |
| Right-click menu bar icon | Check for updates, sign out, quit |
| Click refresh button | Fetch the latest data immediately |
| Click pin button | Toggle always-on-top |
| Click collapse button | Collapse to title bar only |

## Project structure

```
src/
├── main/
│   ├── index.ts          # App entry point
│   ├── authSession.ts    # Login window & cookie auth
│   ├── apiClient.ts      # Data fetching & rank history
│   ├── statsWidget.ts    # Main widget window
│   └── tray.ts           # Menu bar icon
├── renderer/
│   ├── widget.html       # Widget UI markup
│   └── widget.ts         # Widget rendering logic
└── preload/
    ├── widget.ts         # Widget IPC bridge
    └── magiclink.ts      # Magic Link IPC bridge
```

## Development

```bash
npm run watch   # TypeScript watch mode
npm run lint    # ESLint
npm run demo    # Launch with mock data (no login required)
```

Auto-updates are powered by `electron-updater` via GitHub Releases. To publish a new release:

```bash
npm run release
```

## License

MIT
