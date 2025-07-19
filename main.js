const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const AutoLaunch = require('auto-launch');

// Configura il logger per autoUpdater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.autoDownload = false;

let mainWindow;

// Creazione della finestra principale
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: { nodeIntegration: true, contextIsolation: true }
  });
  mainWindow.loadURL('http://localhost:8080/index.html');

  // Eventi per comunicazione con il renderer
  autoUpdater.on("update-available", () => mainWindow.webContents.send("update_available"));
  autoUpdater.on("update-not-available", () => mainWindow.webContents.send("update_not_available"));
  autoUpdater.on("download-progress", progress => mainWindow.webContents.send("update_progress", progress));
  autoUpdater.on("update-downloaded", () => mainWindow.webContents.send("update_downloaded"));
}

// Imposta l’avvio automatico dell’app
function setupAutoLaunch() {
  const appLauncher = new AutoLaunch({
    name: app.getName(),
    path: app.getPath('exe'),
    isHidden: false // cambiare in true se vuoi far partire l'app in background
  });

  appLauncher.isEnabled()
    .then(isEnabled => {
      if (!isEnabled) {
        appLauncher.enable().catch(err => console.error('Errore abilitazione AutoLaunch:', err));
      }
    })
    .catch(err => console.error('Errore controllo AutoLaunch:', err));
}

app.whenReady().then(() => {
  createWindow();
  setupAutoLaunch();

  autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => autoUpdater.checkForUpdates(), 10 * 60 * 1000);
});

// Gestione comando da renderer per l’installazione dell’update
ipcMain.on('install_update', () => {
  autoUpdater.quitAndInstall();
});

// Chiude l’app al termine delle finestre
app.on("window-all-closed", () => {
  app.quit();
});
