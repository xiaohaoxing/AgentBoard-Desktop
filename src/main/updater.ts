import { BrowserWindow, Notification, app, dialog, shell } from 'electron';
import { autoUpdater } from 'electron-updater';

const RELEASES_URL = 'https://github.com/xiaohaoxing/AgentBoard-Desktop/releases/latest';

let updateWindow: BrowserWindow | null = null;

export function setupUpdater(win: BrowserWindow): void {
  updateWindow = win;

  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;

  autoUpdater.on('update-available', async (info) => {
    if (!updateWindow) return;

    const { response } = await dialog.showMessageBox(updateWindow, {
      type: 'info',
      title: 'AgentBoard 有新版本',
      message: `版本 ${info.version} 已发布，前往下载页面获取最新版本？`,
      buttons: ['前往下载', '稍后'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      shell.openExternal(RELEASES_URL);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });

  // Check after 5s delay to not block startup
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      console.error('Update check failed:', err);
    });
  }, 5000);
}

export function checkForUpdatesManually(): void {
  autoUpdater.checkForUpdates().catch((err) => {
    console.error('Manual update check failed:', err);
  });
}

export function setUpdateWindow(win: BrowserWindow): void {
  updateWindow = win;
}

// In development (not packaged), electron-updater won't find updates.
// Set this env var to disable update checks during development:
// ELECTRON_DISABLE_UPDATES=1
export function isUpdateCheckEnabled(): boolean {
  return app.isPackaged && process.env.ELECTRON_DISABLE_UPDATES !== '1';
}
