import path from 'path';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import Store from 'electron-store';

interface WindowState {
  x?: number;
  y?: number;
  width: number;
  height: number;
}

const store = new Store<{ windowState: WindowState }>({
  defaults: { windowState: { width: 1200, height: 800 } },
});

let mainWindow: BrowserWindow | null = null;

function getAssetPath(asset: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', asset);
  }
  return path.join(__dirname, '../../assets', asset);
}

export { getAssetPath };

function saveWindowState(win: BrowserWindow): void {
  const bounds = win.getBounds();
  store.set('windowState', {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  });
}

export function createMainWindow(): BrowserWindow {
  const savedState = store.get('windowState');

  mainWindow = new BrowserWindow({
    x: savedState.x,
    y: savedState.y,
    width: savedState.width,
    height: savedState.height,
    minWidth: 800,
    minHeight: 600,
    title: 'AgentBoard',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.loadURL('https://agentboard.cc');

  // Grant notification permission for agentboard.cc
  mainWindow.webContents.session.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      callback(permission === 'notifications');
    }
  );

  // Inject notification click handler after each page load
  mainWindow.webContents.on('dom-ready', () => {
    mainWindow?.webContents.executeJavaScript(`
      (() => {
        if (window.__ab_patched) return;
        window.__ab_patched = true;
        const _N = window.Notification;
        if (!_N) return;
        function PatchedNotification(title, opts) {
          const n = new _N(title, opts);
          n.addEventListener('click', () => {
            window.__electronIpc?.focusWindow();
          });
          return n;
        }
        Object.assign(PatchedNotification, _N);
        PatchedNotification.prototype = _N.prototype;
        PatchedNotification.permission = _N.permission;
        PatchedNotification.requestPermission = _N.requestPermission.bind(_N);
        window.Notification = PatchedNotification;

        // Proactively request permission on first load
        if (_N.permission === 'default') {
          _N.requestPermission();
        }
      })();
    `).catch(() => {/* ignore */});
  });

  // External links open in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith('https://agentboard.cc') && !url.startsWith('http://agentboard.cc')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('https://agentboard.cc') && !url.startsWith('http://agentboard.cc')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  // Save state on resize/move
  mainWindow.on('resize', () => mainWindow && saveWindowState(mainWindow));
  mainWindow.on('move', () => mainWindow && saveWindowState(mainWindow));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  return mainWindow;
}

export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

// IPC: renderer requests window focus (triggered by notification click)
ipcMain.on('focus-window', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});
