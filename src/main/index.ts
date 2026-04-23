import path from 'path';
import { app, Menu, ipcMain, nativeImage } from 'electron';
import { hasSession, createLoginWindow, setupAuthHandlers } from './authSession';
import { createStatsWidget, getStatsWidget } from './statsWidget';
import { createTray } from './tray';
import { startPolling, setDemoMode } from './apiClient';
import { getDemoBootstrap } from './mockData';
import { setupUpdater, isUpdateCheckEnabled } from './updater';
import { createDebugWindow } from './debugWindow';
import { openSettingsWindow, setupI18nHandlers } from './settingsWindow';
import { t, getLocale, onLocaleChange } from './i18n';

const isDemo = process.argv.includes('--demo');
const isDebug = process.argv.includes('--debug');
let isQuitting = false;

app.on('before-quit', () => {
  isQuitting = true;
});

app.whenReady().then(async () => {
  if (process.platform === 'darwin') {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'assets/icon.png')
      : path.join(__dirname, '../../assets/icon.png');
    // createFromPath auto-detects icon@2x.png for Retina displays.
    app.dock.setIcon(nativeImage.createFromPath(iconPath));
  }

  app.setAboutPanelOptions({
    applicationName: 'AgentBoard',
    website: 'https://github.com/xiaohaoxing/AgentBoard-Desktop',
  });

  setupI18nHandlers();
  setupAuthHandlers();

  // Ensure user is logged in
  if (isDemo) {
    setDemoMode(getDemoBootstrap());
  } else if (!await hasSession()) {
    await createLoginWindow();
  }
  // Main widget
  const widget = createStatsWidget();
  widget.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      widget.hide();
    }
  });

  createTray();
  startPolling();

  if (!isDemo && isUpdateCheckEnabled()) {
    setupUpdater(widget);
  }

  if (isDebug) {
    createDebugWindow();
  }

  function buildMenu(): void {
    const menu = Menu.buildFromTemplate([
      {
        label: 'AgentBoard',
        submenu: [
          { role: 'about' },
          { type: 'separator' },
          {
            label: t('menu.settings'),
            accelerator: 'CmdOrCtrl+,',
            click: () => openSettingsWindow(),
          },
          { type: 'separator' },
          {
            label: `${t('menu.quit')} AgentBoard`,
            accelerator: 'CmdOrCtrl+Q',
            click: () => { isQuitting = true; app.quit(); },
          },
        ],
      },
      {
        label: 'Edit',
        submenu: [
          { role: 'undo' },
          { role: 'redo' },
          { type: 'separator' },
          { role: 'cut' },
          { role: 'copy' },
          { role: 'paste' },
          { role: 'selectAll' },
        ],
      },
    ]);
    Menu.setApplicationMenu(menu);
  }

  buildMenu();
  onLocaleChange(() => buildMenu());

  ipcMain.on('auth:login-success', () => {
    startPolling();
  });
});

app.on('activate', () => {
  const widget = getStatsWidget();
  if (widget) {
    widget.show();
    widget.focus();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
