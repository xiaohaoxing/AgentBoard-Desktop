import { BrowserWindow, Notification, app, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';

let updateWindow: BrowserWindow | null = null;

export function setupUpdater(win: BrowserWindow): void {
  updateWindow = win;

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.on('update-available', (info) => {
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'AgentBoard 有新版本可用',
        body: `版本 ${info.version} 正在后台下载，完成后将提醒您安装。`,
      });
      n.on('click', () => {
        updateWindow?.show();
        updateWindow?.focus();
      });
      n.show();
    }
  });

  autoUpdater.on('update-downloaded', async () => {
    if (!updateWindow) return;

    const { response } = await dialog.showMessageBox(updateWindow, {
      type: 'info',
      title: '更新已就绪',
      message: 'AgentBoard 新版本已下载完成，点击「重启安装」完成更新。',
      buttons: ['重启安装', '稍后'],
      defaultId: 0,
      cancelId: 1,
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Auto-updater error:', err);
  });

  // Check after 5s delay to not block startup
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
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
