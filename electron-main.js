import { app, BrowserWindow, Menu, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 850,
    minWidth: 800,
    minHeight: 600,
    title: 'AI Terminal OS - Systems & Network Copilot',
    backgroundColor: '#020617',
    icon: path.join(__dirname, 'public', 'favicon.ico'),
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    }
  });

  // Start embedded server if running in electron standalone
  try {
    await import('./server.ts');
  } catch (err) {
    console.log('Embedded server already running or started separately.');
  }

  // Load the web terminal engine
  const targetUrl = process.env.ELECTRON_START_URL || 'http://localhost:3000';
  
  setTimeout(() => {
    mainWindow.loadURL(targetUrl).catch(() => {
      // Retry once if server boot was delayed
      setTimeout(() => mainWindow.loadURL(targetUrl), 1500);
    });
  }, 1000);

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Custom Application Menu
  const menuTemplate = [
    {
      label: 'Terminal OS',
      submenu: [
        { label: 'Reload Terminal', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { label: 'Toggle Fullscreen', accelerator: 'F11', click: () => mainWindow.setFullScreen(!mainWindow.isFullScreen()) },
        { type: 'separator' },
        { label: 'Quit Terminal', accelerator: 'CmdOrCtrl+Q', click: () => app.quit() }
      ]
    },
    {
      label: 'View',
      submenu: [
        { label: 'Toggle Developer Tools', accelerator: 'CmdOrCtrl+Shift+I', click: () => mainWindow.webContents.toggleDevTools() },
        { type: 'separator' },
        { label: 'Actual Size', accelerator: 'CmdOrCtrl+0', click: () => mainWindow.webContents.setZoomLevel(0) },
        { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() + 0.5) },
        { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => mainWindow.webContents.setZoomLevel(mainWindow.webContents.getZoomLevel() - 0.5) }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'Documentation & GitHub',
          click: () => shell.openExternal('https://github.com')
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
