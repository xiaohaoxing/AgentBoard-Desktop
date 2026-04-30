import path from 'path';
import { BrowserWindow } from 'electron';
import { t, onLocaleChange } from './i18n';

let trendWin: BrowserWindow | null = null;

export function openTrendWindow(): void {
  if (trendWin) {
    trendWin.focus();
    return;
  }

  trendWin = new BrowserWindow({
    width: 800,
    height: 540,
    minWidth: 640,
    minHeight: 400,
    resizable: true,
    title: t('trend.title'),
    titleBarStyle: 'default',
    webPreferences: {
      preload: path.join(__dirname, '../preload/trend.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  trendWin.loadFile(path.join(__dirname, '../renderer/trend.html'));

  trendWin.webContents.on('did-finish-load', () => {
    trendWin?.setTitle(t('trend.title'));
  });

  trendWin.on('closed', () => {
    trendWin = null;
  });

  onLocaleChange(() => {
    trendWin?.setTitle(t('trend.title'));
  });
}
