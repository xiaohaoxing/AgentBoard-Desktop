import { contextBridge, ipcRenderer } from 'electron';
import { BootstrapData } from '../main/apiClient';

contextBridge.exposeInMainWorld('widgetApi', {
  onStatsUpdated: (cb: (data: BootstrapData) => void) => {
    ipcRenderer.on('stats:updated', (_event, data) => cb(data));
  },
  onStatsError: (cb: (data: { error: boolean; message: string }) => void) => {
    ipcRenderer.on('stats:error', (_event, data) => cb(data));
  },
  onPinChanged: (cb: (pinned: boolean) => void) => {
    ipcRenderer.on('widget:pin-changed', (_event, pinned) => cb(pinned));
  },
  onNeedsLogin: (cb: () => void) => {
    ipcRenderer.on('widget:needs-login', () => cb());
  },
  onSigningIn: (cb: () => void) => {
    ipcRenderer.on('widget:signing-in', () => cb());
  },
  onLocaleChange: (cb: (locale: string) => void) => {
    ipcRenderer.on('i18n:changed', (_event, locale) => cb(locale));
  },
  t: (key: string): string => ipcRenderer.sendSync('i18n:t', key),
  refresh: () => ipcRenderer.send('stats:refresh'),
  collapse: () => ipcRenderer.send('widget:collapse'),
  expand: () => ipcRenderer.send('widget:expand'),
  togglePin: () => ipcRenderer.send('widget:toggle-pin'),
});
