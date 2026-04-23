import path from 'path';
import { BrowserWindow, ipcMain, session } from 'electron';
import { t } from './i18n';

const COOKIE_DOMAIN = 'agentboard.cc';
const SUPABASE_COOKIE_PREFIX = 'sb-vtgpooterdbtqcjvbvgl-auth-token';

let authWindow: BrowserWindow | null = null;
let magicBar: BrowserWindow | null = null;
let needsLoginPending = false;

export async function hasSession(): Promise<boolean> {
  const cookies = await session.defaultSession.cookies.get({ domain: COOKIE_DOMAIN });
  return cookies.some((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX));
}

export async function clearSession(): Promise<void> {
  const cookies = await session.defaultSession.cookies.get({ domain: COOKIE_DOMAIN });
  await Promise.all(
    cookies
      .filter((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX))
      .map((c) => session.defaultSession.cookies.remove(`https://${COOKIE_DOMAIN}`, c.name))
  );
}

function getMagiclinkHtml(): string {
  if (process.env.NODE_ENV === 'development' || !require('electron').app.isPackaged) {
    return path.join(__dirname, '../../dist/renderer/magiclink.html');
  }
  return path.join(process.resourcesPath, 'app.asar', 'dist', 'renderer', 'magiclink.html');
}

function getMagiclinkPreload(): string {
  return path.join(__dirname, '../preload/magiclink.js');
}

function createMagicBar(parent: BrowserWindow): void {
  const { x, y, width, height } = parent.getBounds();
  const barH = 52;

  magicBar = new BrowserWindow({
    x,
    y: y + height - barH,
    width,
    height: barH,
    parent,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: getMagiclinkPreload(),
    },
  });

  magicBar.loadFile(path.join(__dirname, '../../dist/renderer/magiclink.html'));

  // Keep bar anchored to parent when parent moves/resizes
  parent.on('move', () => {
    if (!magicBar || magicBar.isDestroyed()) return;
    const b = parent.getBounds();
    magicBar.setBounds({ x: b.x, y: b.y + b.height - barH, width: b.width, height: barH });
  });
  parent.on('resize', () => {
    if (!magicBar || magicBar.isDestroyed()) return;
    const b = parent.getBounds();
    magicBar.setBounds({ x: b.x, y: b.y + b.height - barH, width: b.width, height: barH });
  });
}

// Opens agentboard.cc for login; resolves when auth cookies appear or window closes.
export function createLoginWindow(startUrl = 'https://agentboard.cc/login'): Promise<void> {
  if (authWindow && !authWindow.isDestroyed()) {
    authWindow.focus();
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    authWindow = new BrowserWindow({
      width: 680,
      height: 760,
      title: t('auth.windowTitle'),
      webPreferences: { nodeIntegration: false, contextIsolation: true },
    });

    authWindow.loadURL(startUrl);
    createMagicBar(authWindow);

    ipcMain.removeAllListeners('magic-link:navigate');
    ipcMain.on('magic-link:navigate', (_e, url: string) => {
      authWindow?.loadURL(url);
    });

    const checkAuth = async (url: string) => {
      if (url.includes('/login') || url.includes('/signup')) return;
      const cookies = await session.defaultSession.cookies.get({ domain: COOKIE_DOMAIN });
      const hasAuth = cookies.some((c) => c.name.startsWith(SUPABASE_COOKIE_PREFIX));
      if (hasAuth) {
        magicBar?.close();
        magicBar = null;
        authWindow?.close();
        authWindow = null;
        needsLoginPending = false;
        ipcMain.emit('auth:login-success');
        resolve();
      }
    };

    authWindow.webContents.on('did-navigate', (_e, url) => checkAuth(url));
    authWindow.webContents.on('did-navigate-in-page', (_e, url) => checkAuth(url));

    authWindow.on('closed', () => {
      magicBar?.close();
      magicBar = null;
      authWindow = null;
      resolve();
    });
  });
}

export function setupAuthHandlers(): void {
  ipcMain.on('auth:needs-login', () => {
    if (needsLoginPending) return;
    needsLoginPending = true;
    createLoginWindow('https://agentboard.cc');
  });

  ipcMain.on('auth:logout', async () => {
    await clearSession();
    needsLoginPending = true;
    createLoginWindow('https://agentboard.cc/login');
  });
}
