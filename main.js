const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');
const os   = require('os');

// ── البيانات في AppData — ثابتة دايماً ──────────────────
const DATA_DIR   = path.join(app.getPath('userData'), 'data');
const BACKUP_DIR = path.join(app.getPath('userData'), 'backups');
const DB_FILE    = path.join(DATA_DIR, 'db.json');

[DATA_DIR, BACKUP_DIR].forEach(d => {
  try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch(e) {}
});

// ── مسار ملفات التطبيق (يشتغل داخل asar وخارجه) ────────
function getAppPath() {
  // app.getAppPath() بيرجع المسار الصح سواء asar أو لأ
  return app.getAppPath();
}

function getIconPath() {
  const ico = path.join(getAppPath(), 'src', 'icon.ico');
  try { return fs.existsSync(ico) ? ico : undefined; } catch(e) { return undefined; }
}

let mainWindow;

function createWindow() {
  const opts = {
    width: 1280, height: 820, minWidth: 900, minHeight: 580,
    title: 'Mizan POS',
    backgroundColor: '#070d1a',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(getAppPath(), 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    }
  };
  const ico = getIconPath();
  if (ico) opts.icon = ico;

  mainWindow = new BrowserWindow(opts);
  mainWindow.setMenuBarVisibility(false);

  const htmlPath = path.join(getAppPath(), 'src', 'index.html');
  // استخدم loadURL مع file:// لأن loadFile بيفشل مع asar
  const htmlURL = 'file://' + htmlPath.replace(/\\/g, '/');

  mainWindow.loadURL(htmlURL)
    .then(() => {
      mainWindow.show();
      mainWindow.focus();
    })
    .catch((err) => {
      mainWindow.show();
      mainWindow.loadURL(
        'data:text/html;charset=utf-8,' +
        encodeURIComponent(
          '<html dir="rtl"><body style="background:#070d1a;color:#f05252;font-family:sans-serif;text-align:center;padding:60px">' +
          '<h2>\u062e\u0637\u0623 \u0641\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u062a\u0637\u0628\u064a\u0642</h2>' +
          '<p style="color:#6a84aa;margin-top:12px">' + htmlPath + '</p>' +
          '<p style="color:#6a84aa;font-size:12px;margin-top:8px">' + err.message + '</p>' +
          '</body></html>'
        )
      );
    });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => app.quit());

// ── IPC Handlers ─────────────────────────────────────────

ipcMain.handle('save-data', async (_e, json) => {
  try { fs.writeFileSync(DB_FILE, json, 'utf-8'); return { ok: true }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('load-data', async () => {
  try {
    if (fs.existsSync(DB_FILE))
      return { ok: true, data: fs.readFileSync(DB_FILE, 'utf-8') };
    return { ok: true, data: null };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('write-file', async (_e, filePath, data) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, data, 'utf-8');
    return { ok: true };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('read-file', async (_e, filePath) => {
  try {
    if (fs.existsSync(filePath))
      return { ok: true, data: fs.readFileSync(filePath, 'utf-8') };
    return { ok: false, error: 'not found' };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('list-folder', async (_e, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) return { ok: true, files: [] };
    const files = fs.readdirSync(folderPath)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const fp = path.join(folderPath, f);
        const st = fs.statSync(fp);
        return { name: f, path: fp, size: st.size, mtime: st.mtimeMs };
      })
      .sort((a, b) => b.mtime - a.mtime);
    return { ok: true, files };
  } catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('select-folder', async (_e, title) => {
  if (!mainWindow) return { ok: false };
  const r = await dialog.showOpenDialog(mainWindow, {
    title: title || '\u0627\u062e\u062a\u0631 \u0645\u062c\u0644\u062f\u0627\u064b',
    properties: ['openDirectory'],
    defaultPath: os.homedir(),
  });
  if (r.canceled || !r.filePaths.length) return { ok: false };
  return { ok: true, path: r.filePaths[0] };
});

ipcMain.handle('save-dialog', async (_e, defaultName, data) => {
  if (!mainWindow) return { ok: false };
  const r = await dialog.showSaveDialog(mainWindow, {
    title: '\u062d\u0641\u0638 \u0646\u0633\u062e\u0629 \u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629',
    defaultPath: path.join(os.homedir(), 'Desktop', defaultName || 'backup.json'),
    filters: [{ name: 'JSON', extensions: ['json'] }],
  });
  if (r.canceled || !r.filePath) return { ok: false };
  try { fs.writeFileSync(r.filePath, data, 'utf-8'); return { ok: true, path: r.filePath }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('open-dialog', async () => {
  if (!mainWindow) return { ok: false };
  const r = await dialog.showOpenDialog(mainWindow, {
    title: '\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0646\u0633\u062e\u0629 \u0627\u062d\u062a\u064a\u0627\u0637\u064a\u0629',
    defaultPath: os.homedir(),
    filters: [{ name: 'JSON', extensions: ['json'] }, { name: 'All Files', extensions: ['*'] }],
    properties: ['openFile'],
  });
  if (r.canceled || !r.filePaths.length) return { ok: false };
  try { return { ok: true, data: fs.readFileSync(r.filePaths[0], 'utf-8'), path: r.filePaths[0] }; }
  catch(e) { return { ok: false, error: e.message }; }
});

ipcMain.handle('get-default-backup-dir', () => BACKUP_DIR);

ipcMain.handle('app-info', () => ({
  platform:   process.platform,
  version:    app.getVersion(),
  dataDir:    DATA_DIR,
  backupDir:  BACKUP_DIR,
  isElectron: true,
  portable:   true,
}));
