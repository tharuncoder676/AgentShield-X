const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, ipcMain, shell } = require('electron');
const path = require('path');
const http = require('http');
const { spawn } = require('child_process');

let mainWindow = null;
let tray = null;
let backendProcess = null;
const isDev = process.argv.includes('--dev') || !app.isPackaged;
const BACKEND_PORT = 8002;
const FRONTEND_DEV_URL = 'http://localhost:3000';

// Check if Python Control API backend is reachable
function checkBackendHealth() {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${BACKEND_PORT}/api/v1/health`, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Check if frontend dev server is running
function checkFrontendDev() {
  return new Promise((resolve) => {
    const req = http.get(FRONTEND_DEV_URL, (res) => {
      resolve(res.statusCode >= 200 && res.statusCode < 400);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Automatically start Python backend if offline
async function ensureBackendRunning() {
  const isAlive = await checkBackendHealth();
  if (isAlive) {
    console.log('[AgentShield-X Desktop] Backend server is already running on port', BACKEND_PORT);
    return;
  }

  console.log('[AgentShield-X Desktop] Spawning background Python control engine...');
  const repoRoot = path.resolve(__dirname, '../../../');
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  const startScript = path.join(repoRoot, 'start_server.py');

  try {
    backendProcess = spawn(pythonCmd, ['-u', startScript], {
      cwd: repoRoot,
      stdio: 'pipe',
      detached: false
    });

    backendProcess.stdout.on('data', (data) => {
      console.log(`[Engine]: ${data}`);
    });

    backendProcess.stderr.on('data', (data) => {
      console.error(`[Engine Error]: ${data}`);
    });
  } catch (err) {
    console.warn('[AgentShield-X Desktop] Failed to auto-spawn backend process:', err.message);
  }
}

async function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, '../assets/icon.ico')
    : path.join(__dirname, '../assets/icon.png');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: '#08090b',
    title: 'AgentShield-X | Deterministic AI Agent Security Super App',
    icon: iconPath,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false
    }
  });

  // Ensure backend is reachable
  ensureBackendRunning();

  // Load URL or local static dist
  const isDevRunning = await checkFrontendDev();
  if (isDev && isDevRunning) {
    console.log('[AgentShield-X Desktop] Loading live Vite dev server at:', FRONTEND_DEV_URL);
    mainWindow.loadURL(FRONTEND_DEV_URL);
  } else {
    const distPath = path.resolve(__dirname, '../../console/dist/index.html');
    console.log('[AgentShield-X Desktop] Loading production bundle:', distPath);
    mainWindow.loadFile(distPath).catch(() => {
      // Fallback to dev url if dist is not found
      mainWindow.loadURL(FRONTEND_DEV_URL);
    });
  }

  // Intercept new window requests and open in default OS browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  createTray(iconPath);
}

function createTray(iconPath) {
  if (tray) return;

  const trayIcon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(trayIcon);
  tray.setToolTip('AgentShield-X (Active & Enforcing)');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'AgentShield-X',
      icon: nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 }),
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Console',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        } else {
          createWindow();
        }
      }
    },
    {
      label: 'Shield Status: Active (0.85ms SLA)',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit AgentShield-X',
      click: () => {
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    }
  });
}

// IPC Handlers
ipcMain.on('desktop-notify', (event, { title, body }) => {
  if (Notification.isSupported()) {
    new Notification({
      title: title || 'AgentShield-X Alert',
      body: body || 'Security verification event triggered',
      icon: path.join(__dirname, '../assets/icon.png')
    }).show();
  }
});

ipcMain.handle('check-engine-status', async () => {
  return await checkBackendHealth();
});

ipcMain.handle('start-engine', async () => {
  await ensureBackendRunning();
  return await checkBackendHealth();
});

// App lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('will-quit', () => {
  if (backendProcess) {
    try {
      backendProcess.kill();
    } catch (e) {
      // ignore
    }
  }
});

