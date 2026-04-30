import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('trendApi', {
  getUsageHistory: (range: string): Promise<{ label: string; tokens: number }[]> =>
    ipcRenderer.invoke('get-usage-history', { range }),
  clearUsageHistory: (): Promise<void> =>
    ipcRenderer.invoke('clear-usage-history'),
  confirmClear: (): Promise<boolean> =>
    ipcRenderer.invoke('confirm-clear-history'),
  t: (key: string): string => ipcRenderer.sendSync('i18n:t', key),
  onLocaleChange: (cb: (locale: string) => void) => {
    ipcRenderer.on('i18n:changed', (_event, locale) => cb(locale));
  },
});
