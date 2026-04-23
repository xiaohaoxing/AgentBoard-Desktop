import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('settingsApi', {
  getLocale: (): Promise<string> => ipcRenderer.invoke('i18n:get-locale'),
  setLocale: (locale: string): void => { ipcRenderer.send('i18n:set-locale', locale); },
  onLocaleChange: (cb: (locale: string) => void): void => {
    ipcRenderer.on('i18n:changed', (_event, locale) => cb(locale));
  },
  t: (key: string): string => ipcRenderer.sendSync('i18n:t', key),
});
