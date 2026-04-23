import path from 'path';
import { app, BrowserWindow, ipcMain, webContents } from 'electron';
import { getLocale, setLocale, t, onLocaleChange } from './i18n';
import type { Locale } from './i18n';

let settingsWindow: BrowserWindow | null = null;

function getHtmlPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'dist/renderer/settings.html')
    : path.join(__dirname, '../../dist/renderer/settings.html');
}

export function openSettingsWindow(): void {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 360,
    height: 240,
    resizable: false,
    fullscreenable: false,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 12 },
    transparent: true,
    hasShadow: true,
    title: t('settings.title'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, '../preload/settings.js'),
    },
  });

  settingsWindow.loadFile(getHtmlPath());
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

// ── IPC handlers ──────────────────────────────────────────────────────────────

export function setupI18nHandlers(): void {
  ipcMain.handle('i18n:get-locale', () => getLocale());

  ipcMain.on('i18n:set-locale', (_event, locale: Locale) => {
    setLocale(locale);
  });

  ipcMain.on('i18n:t', (event, key: string) => {
    event.returnValue = t(key);
  });

  // Broadcast locale changes to all renderer processes
  onLocaleChange((locale) => {
    for (const wc of webContents.getAllWebContents()) {
      if (!wc.isDestroyed()) wc.send('i18n:changed', locale);
    }
  });
}
