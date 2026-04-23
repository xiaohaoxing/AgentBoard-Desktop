import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('__electronIpc', {
  focusWindow: () => ipcRenderer.send('focus-window'),
});
