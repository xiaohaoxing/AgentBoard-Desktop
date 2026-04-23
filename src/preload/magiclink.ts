import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('magiclinkApi', {
  navigate: (url: string) => ipcRenderer.send('magic-link:navigate', url),
  t: (key: string): string => ipcRenderer.sendSync('i18n:t', key),
  onLocaleChange: (cb: (locale: string) => void): void => {
    ipcRenderer.on('i18n:changed', (_event, locale) => cb(locale));
  },
});
