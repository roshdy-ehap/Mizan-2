const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  portable:   true,
  platform:   process.platform,

  saveData:   (json)         => ipcRenderer.invoke('save-data', json),
  loadData:   ()             => ipcRenderer.invoke('load-data'),
  writeFile:  (path, data)   => ipcRenderer.invoke('write-file', path, data),
  readFile:   (path)         => ipcRenderer.invoke('read-file', path),
  listBackups:(dir)          => ipcRenderer.invoke('list-folder', dir),
  selectFolder: (title)      => ipcRenderer.invoke('select-folder', title),
  saveDialog:   (name, data) => ipcRenderer.invoke('save-dialog', name, data),
  openDialog:   ()           => ipcRenderer.invoke('open-dialog'),
  getDefaultBackupDir: ()    => ipcRenderer.invoke('get-default-backup-dir'),
  appInfo:    ()             => ipcRenderer.invoke('app-info'),
});
