const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveMarkdownFiles: (params) => ipcRenderer.invoke('fs:saveMarkdownFiles', params),
  readMarkdownFiles: (params) => ipcRenderer.invoke('fs:readMarkdownFiles', params),
  onTriggerQuickCapture: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('trigger-quick-capture', handler);
    return () => ipcRenderer.removeListener('trigger-quick-capture', handler);
  },
});

