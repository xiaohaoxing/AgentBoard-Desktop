import path from 'path';
import { BrowserWindow } from 'electron';
import { getAssetPath } from './window';

let debugWindow: BrowserWindow | null = null;

export function createDebugWindow(): BrowserWindow {
  debugWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    title: 'AgentBoard Debug',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      devTools: true,
    },
    icon: getAssetPath('icon.icns'),
  });

  debugWindow.loadURL('https://agentboard.cc');
  debugWindow.webContents.openDevTools({ mode: 'detach' });

  debugWindow.on('closed', () => {
    debugWindow = null;
  });

  return debugWindow;
}

export function getDebugWindow(): BrowserWindow | null {
  return debugWindow;
}
