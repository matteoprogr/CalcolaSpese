const { app, BrowserWindow } = require('electron');
const path = require('path');
const childProcess = require('child_process');

// Override di spawn per logging (opzionale, tienilo solo se ti serve)
const originalSpawn = childProcess.spawn;
childProcess.spawn = function() {
  console.log('Spawn args:', arguments);
  return originalSpawn.apply(this, arguments);
};

let backendProcess;

function createBackendProcess(javaPath, jarPath) {
  return childProcess.spawn(javaPath, ['-jar', jarPath], {
    cwd: path.dirname(jarPath),
    shell: true,
    env: process.env
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      nodeIntegration: false,  // sicurezza
      contextIsolation: true   // sicurezza
    }
  });
  win.loadURL('http://localhost:8080/index.html');
}

app.whenReady().then(() => {
  // Definisco i percorsi qui dentro, quando l'app è pronta
  const jarPath = path.join(__dirname, 'ing', 'ing-0.0.1-SNAPSHOT.jar');
  const javaPath = process.env.JAVA_HOME
    ? path.join(process.env.JAVA_HOME, 'bin', 'java')
    : 'java';

  backendProcess = createBackendProcess(javaPath, jarPath);

  // Eventuale logging di errori o uscita del processo backend
  backendProcess.on('error', (err) => {
    console.error('Backend process error:', err);
  });
  backendProcess.on('exit', (code, signal) => {
    console.log(`Backend process exited with code ${code}, signal ${signal}`);
  });

  createWindow();

  app.on('activate', () => {
    // Su macOS riapri la finestra se tutte le finestre sono chiuse
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Assicurati di terminare il processo backend quando chiudi tutte le finestre
app.on('window-all-closed', () => {
  if (backendProcess) {
    backendProcess.kill();
    backendProcess = null;
  }
  // Su macOS l'app resta aperta finché non si fa cmd+Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
