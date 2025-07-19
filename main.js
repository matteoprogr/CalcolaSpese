const { app, BrowserWindow, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

// Inizializza il logger per autoUpdater
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = "info";
autoUpdater.autoDownload = false; // se vuoi notificare senza scaricare automaticamente

function createWindow() {
  const win = new BrowserWindow({
    width: 1000, height: 800,
    webPreferences: { nodeIntegration: true, contextIsolation: true }
  });
  win.loadURL('http://localhost:8080/index.html');

  // Comunica eventi aggiornamento al renderer
  autoUpdater.on("update-available", () => win.webContents.send("update_available"));
  autoUpdater.on("update-not-available", () => win.webContents.send("update_not_available"));
  autoUpdater.on("download-progress", progress => win.webContents.send("update_progress", progress));
  autoUpdater.on("update-downloaded", () => win.webContents.send("update_downloaded"));
}

app.on("ready", () => {
  createWindow();

  autoUpdater.checkForUpdatesAndNotify();

  // Puoi schedulare nuovi controlli periodici
  setInterval(() => autoUpdater.checkForUpdates(), 10 * 60 * 1000);
});

ipcMain.on('install_update', () => {
  autoUpdater.quitAndInstall();
});

app.on("window-all-closed", () => {
  app.quit();
});
