const { app, BrowserWindow, shell, screen, ipcMain, dialog, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

// Suppress GPU disk cache permission conflicts on Windows
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache');

let mainWindow = null;

function getWindowStatePath() {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function loadWindowState() {
  try {
    const raw = fs.readFileSync(getWindowStatePath(), 'utf8');
    const state = JSON.parse(raw);
    if (state && typeof state.width === 'number' && typeof state.height === 'number') {
      return state;
    }
  } catch (e) {}
  return {
    width: 1280,
    height: 840,
    isMaximized: false,
  };
}

function saveWindowState(win) {
  if (!win || win.isDestroyed()) return;
  try {
    const isMaximized = win.isMaximized();
    let bounds;
    if (isMaximized) {
      bounds = win.getNormalBounds ? win.getNormalBounds() : win.getBounds();
    } else {
      bounds = win.getBounds();
    }
    const state = {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      isMaximized,
    };
    fs.writeFileSync(getWindowStatePath(), JSON.stringify(state, null, 2));
  } catch (e) {}
}

function createWindow() {
  const savedState = loadWindowState();

  let x = savedState.x;
  let y = savedState.y;
  if (typeof x === 'number' && typeof y === 'number') {
    const displays = screen.getAllDisplays();
    const isVisible = displays.some(display => {
      const { x: dx, y: dy, width: dw, height: dh } = display.bounds;
      return x >= dx && x < dx + dw && y >= dy && y < dy + dh;
    });
    if (!isVisible) {
      x = undefined;
      y = undefined;
    }
  }

  mainWindow = new BrowserWindow({
    x,
    y,
    width: Math.max(980, savedState.width || 1280),
    height: Math.max(640, savedState.height || 840),
    minWidth: 980,
    minHeight: 640,
    title: 'ChronoNote 时光墨历',
    backgroundColor: '#090a0d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    autoHideMenuBar: true,
  });

  if (savedState.isMaximized) {
    mainWindow.maximize();
  }

  // Auto-save window size & position on resize or move
  let saveTimer = null;
  const onBoundsChange = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      saveWindowState(mainWindow);
    }, 400);
  };

  mainWindow.on('resize', onBoundsChange);
  mainWindow.on('move', onBoundsChange);
  mainWindow.on('close', () => {
    saveWindowState(mainWindow);
  });

  const isDev = process.env.NODE_ENV === 'development' || process.argv.includes('--dev');

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers for Custom Local Folder Support
ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择 ChronoNote 本地数据存放文件夹',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle('fs:saveMarkdownFiles', async (event, { folderPath, files }) => {
  if (!folderPath || !files || !Array.isArray(files)) return { success: false };
  try {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    for (const f of files) {
      const targetDir = f.subDir ? path.join(folderPath, f.subDir) : folderPath;
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      fs.writeFileSync(path.join(targetDir, f.filename), f.content, 'utf8');
    }
    return { success: true, count: files.length };
  } catch (err) {
    console.error('Error saving markdown files:', err);
    return { success: false, error: String(err) };
  }
});

app.whenReady().then(() => {
  createWindow();

  // Register system-wide Global Shortcut: Alt+1 for Quick Capture HUD
  try {
    globalShortcut.register('Alt+1', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) {
          mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
        mainWindow.webContents.send('trigger-quick-capture');
      }
    });
  } catch (err) {
    console.error('Failed to register global shortcut Alt+1:', err);
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('will-quit', () => {
  try {
    globalShortcut.unregisterAll();
  } catch (e) {}
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

