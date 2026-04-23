#!/usr/bin/env node
// Patches the local Electron binary's Info.plist so the dock label and
// menu-bar app name show "AgentBoard" instead of "Electron" in dev mode.
// Only runs on macOS; no-ops silently on other platforms.
const { execSync } = require('child_process');
const path = require('path');

if (process.platform !== 'darwin') process.exit(0);

const plist = path.join(
  __dirname,
  '../node_modules/electron/dist/Electron.app/Contents/Info.plist'
);

const patch = (key, value) => {
  try {
    execSync(`/usr/libexec/PlistBuddy -c "Set :${key} ${value}" "${plist}"`, { stdio: 'pipe' });
  } catch {
    // Key may not exist — try Add instead
    try {
      execSync(`/usr/libexec/PlistBuddy -c "Add :${key} string ${value}" "${plist}"`, { stdio: 'pipe' });
    } catch {}
  }
};

patch('CFBundleDisplayName', 'AgentBoard');
patch('CFBundleName', 'AgentBoard');
patch('CFBundleIdentifier', 'cc.agentboard.desktop');

// Force Launch Services to re-read the patched bundle so the Dock label updates.
const lsregister =
  '/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/' +
  'LaunchServices.framework/Versions/A/Support/lsregister';
const appBundle = path.join(__dirname, '../node_modules/electron/dist/Electron.app');
try {
  execSync(`"${lsregister}" -f "${appBundle}"`, { stdio: 'pipe' });
} catch {}
