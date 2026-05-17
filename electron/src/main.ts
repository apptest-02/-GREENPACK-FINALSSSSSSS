// Greenpack Pro — Electron Main Process
// Wraps the FastAPI backend and React frontend as a native Windows desktop app

import {
  app, BrowserWindow, Tray, Menu, nativeImage,
  ipcMain, dialog, shell, Notification
} from 'electron';
import { autoUpdater } from 'electron-updater';
import Store from 'electron-store';
import path from 'path';
import { spawn, ChildProcess, execSync } from 'child_process';
import { existsSync } from 'fs';
import http from 'http';

// ── Configuration ──────────────────────────────────────────────────────────────
const store = new Store({
  defaults: {
    windowBounds: { width: 1440, height: 900 },
    apiPort: 18080,
    scanner: { device: '', resolution: 300 },
    firstRun: true,
  }
});

const API_PORT = store.get('apiPort', 18080) as number;
const API_URL = `http://localhost:${API_PORT}`;
const IS_DEV = !app.isPackaged;
const INSTALL_DIR = IS_DEV ? path.join(__dirname, '..', '..', 'backend') : path.dirname(app.getPath('exe'));

// ── State ──────────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let engineProcess: ChildProcess | null = null;
let engineReady = false;

// ── Windows DPI Awareness ──────────────────────────────────────────────────────
if (process.platform === 'win32') {
  app.commandLine.appendSwitch('high-dpi-support', '1');
}

// ── Engine Management ──────────────────────────────────────────────────────────
function getEnginePath(): string {
  if (IS_DEV) {
    return path.join(INSTALL_DIR, 'run_engine.bat');
  }
  // Production: PyInstaller compiled exe
  const exePath = path.join(INSTALL_DIR, 'engine', 'greenpack_engine', 'greenpack_engine.exe');
  if (existsSync(exePath)) return exePath;
  // Fallback: same directory
  return path.join(path.dirname(app.getPath('exe')), 'engine', 'greenpack_engine.exe');
}

function startEngine(): void {
  const enginePath = getEnginePath();

  if (!existsSync(enginePath) && !IS_DEV) {
    console.error(`Engine not found: ${enginePath}`);
    showEngineError('Greenpack Pro engine not found. Please reinstall the application.');
    return;
  }

  console.log(`Starting engine: ${enginePath}`);

  const cwd = IS_DEV ? INSTALL_DIR : path.dirname(enginePath);

  if (IS_DEV) {
    engineProcess = spawn('cmd', ['/c', enginePath], {
      cwd,
      windowsHide: true,
      env: { ...process.env, API_PORT: String(API_PORT) },
    });
  } else {
    engineProcess = spawn(enginePath, [], {
      cwd,
      windowsHide: true,
      detached: false,
    });
  }

  engineProcess.stdout?.on('data', (data: Buffer) => {
    const text = data.toString();
    console.log('[Engine]', text.trim());
    if (text.includes('Application startup complete') || text.includes('ready at')) {
      engineReady = true;
      console.log('Engine is ready');
    }
  });

  engineProcess.stderr?.on('data', (data: Buffer) => {
    console.error('[Engine Error]', data.toString().trim());
  });

  engineProcess.on('exit', (code) => {
    console.log(`Engine exited with code ${code}`);
    engineReady = false;
    if (code !== 0 && mainWindow) {
      // Attempt restart after 5 seconds
      setTimeout(() => {
        console.log('Restarting engine...');
        startEngine();
      }, 5000);
    }
  });

  engineProcess.on('error', (err) => {
    console.error('Engine spawn error:', err);
  });
}

async function waitForEngine(maxWaitMs = 30000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWaitMs) {
    try {
      await new Promise<void>((resolve, reject) => {
        const req = http.get(`${API_URL}/api/health`, (res) => {
          if (res.statusCode === 200) resolve();
          else reject(new Error(`HTTP ${res.statusCode}`));
        });
        req.on('error', reject);
        req.setTimeout(1000, () => { req.destroy(); reject(new Error('timeout')); });
      });
      return true;
    } catch {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  return false;
}

// ── Window Management ──────────────────────────────────────────────────────────
function createWindow(): void {
  const { width, height } = store.get('windowBounds') as { width: number; height: number };

  mainWindow = new BrowserWindow({
    width,
    height,
    minWidth: 1024,
    minHeight: 600,
    frame: false,           // Custom title bar
    titleBarStyle: 'hidden',
    show: false,
    backgroundColor: '#0D1B2A',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
    },
    icon: path.join(__dirname, '..', 'assets', 'greenpack.ico'),
  });

  // Load app
  const appUrl = IS_DEV
    ? 'http://localhost:5173'
    : `${API_URL}`;   // Production: served by FastAPI static files

  mainWindow.loadURL(appUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (IS_DEV) mainWindow?.webContents.openDevTools({ mode: 'detach' });
  });

  // Save window size
  mainWindow.on('resize', () => {
    if (mainWindow) {
      store.set('windowBounds', mainWindow.getBounds());
    }
  });

  // Minimize to tray on close
  mainWindow.on('close', (e) => {
    if (tray) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  // External links open in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// ── System Tray ────────────────────────────────────────────────────────────────
function createTray(): void {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray-ok.png');
  const icon = existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
  tray = new Tray(icon.resize({ width: 16, height: 16 }));

  updateTrayMenu('ok');
  tray.setToolTip('Greenpack Pro');
  tray.on('double-click', showMainWindow);
}

function updateTrayMenu(status: 'ok' | 'processing' | 'fail' | 'batch' | 'offline') {
  if (!tray) return;
  const menu = Menu.buildFromTemplate([
    {
      label: 'Greenpack Pro',
      enabled: false,
      icon: path.join(__dirname, '..', 'assets', 'tray-ok.png'),
    },
    { type: 'separator' },
    { label: '📊 Show App', click: showMainWindow },
    { label: '➕ New Inspection', click: () => { showMainWindow(); navigateTo('/new-inspection'); } },
    { type: 'separator' },
    { label: `Status: ${status.toUpperCase()}`, enabled: false },
    { type: 'separator' },
    { label: '🔄 Restart Engine', click: restartEngine },
    { label: '❌ Quit', click: () => { app.quit(); } },
  ]);
  tray.setContextMenu(menu);
}

function showMainWindow(): void {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  } else {
    createWindow();
  }
}

function navigateTo(path: string): void {
  mainWindow?.webContents.executeJavaScript(`
    window.history.pushState({}, '', '${path}');
    window.dispatchEvent(new PopStateEvent('popstate'));
  `);
}

function restartEngine(): void {
  if (engineProcess) {
    engineProcess.kill();
    engineProcess = null;
  }
  setTimeout(startEngine, 1000);
}

// ── Windows Notifications ──────────────────────────────────────────────────────
function showToast(title: string, body: string, type: 'info' | 'success' | 'error' = 'info'): void {
  if (!Notification.isSupported()) return;
  const notification = new Notification({
    title,
    body,
    icon: path.join(__dirname, '..', 'assets', 'greenpack.png'),
    timeoutType: 'default',
  });
  notification.on('click', showMainWindow);
  notification.show();
}

function showEngineError(message: string): void {
  dialog.showErrorBox('Greenpack Pro — Engine Error', message);
}

// ── IPC Handlers ───────────────────────────────────────────────────────────────
ipcMain.handle('window-minimize', () => mainWindow?.minimize());
ipcMain.handle('window-maximize', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle('window-close', () => mainWindow?.close());
ipcMain.handle('window-is-maximized', () => mainWindow?.isMaximized() ?? false);

ipcMain.handle('get-config', () => store.store);
ipcMain.handle('set-config', (_, config: any) => {
  Object.entries(config).forEach(([k, v]) => store.set(k, v));
  return true;
});

ipcMain.handle('open-file-dialog', async (_, options: Electron.OpenDialogOptions) => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openFile'],
    filters: [
      { name: 'Label Files', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'tiff', 'bmp'] },
      { name: 'All Files', extensions: ['*'] },
    ],
    ...options,
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result.filePaths[0] || null;
});

ipcMain.handle('show-toast', (_, { title, body, type }) => {
  showToast(title, body, type);
});

ipcMain.handle('get-version', () => app.getVersion());
ipcMain.handle('get-api-url', () => API_URL);

ipcMain.handle('check-engine-health', async () => {
  try {
    const ready = await waitForEngine(3000);
    return { healthy: ready };
  } catch {
    return { healthy: false };
  }
});

// ── Auto-Update ────────────────────────────────────────────────────────────────
function setupAutoUpdater(): void {
  if (IS_DEV) return;

  autoUpdater.checkForUpdatesAndNotify();

  autoUpdater.on('update-available', (info) => {
    mainWindow?.webContents.send('update-available', info);
    showToast('Update Available', `Greenpack Pro v${info.version} is ready to download`);
  });

  autoUpdater.on('update-downloaded', () => {
    mainWindow?.webContents.send('update-downloaded');
    showToast('Update Ready', 'Greenpack Pro update will install on next restart');
  });
}

// ── App Lifecycle ──────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  console.log('Greenpack Pro starting...');

  // Start engine
  startEngine();

  // Create tray first (app visible immediately)
  createTray();

  // Wait for engine (show loading state)
  createWindow();
  mainWindow?.webContents.executeJavaScript(`
    document.title = 'Greenpack Pro — Starting engine...';
  `).catch(() => {});

  const engineStarted = await waitForEngine(45000);
  if (!engineStarted) {
    showEngineError(
      'Could not start the Greenpack Pro engine after 45 seconds.\n\n' +
      'Possible causes:\n' +
      '• Antivirus blocked greenpack_engine.exe\n' +
      '• Port 18080 is in use by another application\n' +
      '• Insufficient disk space\n\n' +
      'Please check Windows Event Viewer → Application for details.'
    );
  }

  setupAutoUpdater();
  app.on('activate', () => { if (!mainWindow) createWindow(); });
});

app.on('window-all-closed', () => {
  // Keep running in system tray
  // app.quit() only on explicit quit
});

app.on('before-quit', () => {
  // Stop engine on quit
  if (engineProcess) {
    try { engineProcess.kill('SIGTERM'); } catch { }
    engineProcess = null;
  }
  tray?.destroy();
});

// Handle second instance — focus existing window
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });
}
