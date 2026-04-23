import path from 'path';
import { Menu, Tray, nativeImage, app, ipcMain } from 'electron';
import { getStatsWidget, toggleStatsWidget } from './statsWidget';
import { checkForUpdatesManually } from './updater';
import { t, onLocaleChange } from './i18n';
import type { BootstrapData } from './apiClient';

let tray: Tray | null = null;
let rankAnimTimer: ReturnType<typeof setTimeout> | null = null;

function getAssetPath(asset: string): string {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, 'assets', asset);
  }
  return path.join(__dirname, '../../assets', asset);
}

export function createTray(): Tray {
  const iconPath = getAssetPath('trayTemplate.png');
  const icon = nativeImage.createFromPath(iconPath);
  icon.setTemplateImage(true);

  tray = new Tray(icon);
  tray.setToolTip('AgentBoard');

  ipcMain.on('stats:updated', (_event, data: BootstrapData) => {
    if (!tray) return;
    const uid = data.viewer?.id ?? data.currentUserId;
    const me = (uid ? data.people.find((p) => p.user_id === uid) : null)
      ?? (data.viewer?.handle ? data.people.find((p) => p.handle === data.viewer!.handle) : null)
      ?? null;
    if (!me) return;

    const rank = me.rank;
    const change = data.myPeopleRankChange ?? null;

    if (rankAnimTimer) clearTimeout(rankAnimTimer);

    if (change && change !== 0) {
      const arrow = change > 0 ? '↑' : '↓';
      tray.setTitle(`${arrow}#${rank}`);
      rankAnimTimer = setTimeout(() => { tray?.setTitle(`#${rank}`); }, 3000);
    } else {
      tray.setTitle(`#${rank}`);
    }
  });

  tray.on('click', () => {
    toggleStatsWidget();
  });

  const buildContextMenu = () =>
    Menu.buildFromTemplate([
      {
        label: t('tray.show'),
        click: () => {
          const widget = getStatsWidget();
          widget?.show();
          widget?.focus();
        },
      },
      {
        label: t('tray.checkUpdates'),
        click: () => checkForUpdatesManually(),
      },
      { type: 'separator' },
      {
        label: t('tray.logout'),
        click: () => ipcMain.emit('auth:logout'),
      },
      { type: 'separator' },
      {
        label: t('tray.quit'),
        role: 'quit',
      },
    ]);

  tray.on('right-click', () => {
    tray?.popUpContextMenu(buildContextMenu());
  });

  onLocaleChange(() => {
    // Context menu is built on demand, nothing to rebuild eagerly
  });

  return tray;
}

export function getTray(): Tray | null {
  return tray;
}
