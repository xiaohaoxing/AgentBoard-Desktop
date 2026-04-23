import path from 'path';
import { app, BrowserWindow, ipcMain, screen } from 'electron';
import Store from 'electron-store';
import { BootstrapData } from './apiClient';

interface WidgetState {
  x?: number;
  y?: number;
  collapsed: boolean;
  pinned?: boolean;
}

const store = new Store<{ widgetState: WidgetState }>({
  name: 'widget',
  defaults: { widgetState: { collapsed: false } },
});

const WIDGET_WIDTH = 320;
const WIDGET_HEIGHT = 520;
const COLLAPSED_HEIGHT = 38;
const EDGE_MARGIN = 16;

let statsWidget: BrowserWindow | null = null;

function getDefaultPosition(): { x: number; y: number } {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  return {
    x: width - WIDGET_WIDTH - EDGE_MARGIN,
    y: height - WIDGET_HEIGHT - EDGE_MARGIN,
  };
}

export function createStatsWidget(): BrowserWindow {
  const saved = store.get('widgetState');
  const defaultPos = getDefaultPosition();
  const collapsed = saved.collapsed;
  const pinned = saved.pinned ?? true;

  statsWidget = new BrowserWindow({
    x: saved.x ?? defaultPos.x,
    y: saved.y ?? defaultPos.y,
    width: WIDGET_WIDTH,
    height: collapsed ? COLLAPSED_HEIGHT : WIDGET_HEIGHT,
    minWidth: WIDGET_WIDTH,
    maxWidth: WIDGET_WIDTH,
    resizable: false,
    fullscreenable: false,
    alwaysOnTop: pinned,
    titleBarStyle: 'hidden',
    trafficLightPosition: { x: 10, y: 12 },
    transparent: true,
    hasShadow: true,
    title: 'AgentBoard-Desktop',
    webPreferences: {
      preload: path.join(__dirname, '../preload/widget.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  const widgetHtml = app.isPackaged
    ? path.join(process.resourcesPath, 'dist/renderer/widget.html')
    : path.join(__dirname, '../../dist/renderer/widget.html');

  statsWidget.loadFile(widgetHtml);

  statsWidget.webContents.on('did-finish-load', () => {
    statsWidget?.webContents.send('widget:pin-changed', statsWidget.isAlwaysOnTop());
  });

  statsWidget.on('move', () => {
    if (!statsWidget) return;
    const [x, y] = statsWidget.getPosition();
    store.set('widgetState', { ...store.get('widgetState'), x, y });
  });

  statsWidget.on('closed', () => {
    statsWidget = null;
  });

  // Forward stats data to renderer
  ipcMain.on('stats:updated', (_event, data: BootstrapData) => {
    statsWidget?.webContents.send('stats:updated', data);
  });

  ipcMain.on('stats:error', (_event, data) => {
    statsWidget?.webContents.send('stats:error', data);
  });

  ipcMain.on('widget:collapse', () => {
    if (!statsWidget) return;
    statsWidget.setSize(WIDGET_WIDTH, COLLAPSED_HEIGHT, true);
    store.set('widgetState', { ...store.get('widgetState'), collapsed: true });
  });

  ipcMain.on('widget:expand', () => {
    if (!statsWidget) return;
    statsWidget.setSize(WIDGET_WIDTH, WIDGET_HEIGHT, true);
    store.set('widgetState', { ...store.get('widgetState'), collapsed: false });
  });

  ipcMain.on('widget:toggle-pin', () => {
    if (!statsWidget) return;
    const newPinned = !statsWidget.isAlwaysOnTop();
    statsWidget.setAlwaysOnTop(newPinned, 'floating');
    statsWidget.webContents.send('widget:pin-changed', newPinned);
    store.set('widgetState', { ...store.get('widgetState'), pinned: newPinned });
  });

  ipcMain.on('auth:needs-login', () => {
    statsWidget?.webContents.send('widget:needs-login');
  });

  ipcMain.on('auth:login-success', () => {
    statsWidget?.webContents.send('widget:signing-in');
  });

  return statsWidget;
}

export function getStatsWidget(): BrowserWindow | null {
  return statsWidget;
}

export function toggleStatsWidget(): void {
  if (!statsWidget) return;
  if (statsWidget.isVisible() && statsWidget.isFocused()) {
    statsWidget.hide();
  } else {
    statsWidget.show();
    statsWidget.focus();
  }
}
