const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let backendProc;

function startBackend() {
  const backendEntry = path.resolve(__dirname, '../backend/dist/index.js');
  backendProc = spawn(process.execPath, [backendEntry], {
    env: { ...process.env, PORT: '3000' },
    stdio: 'inherit'
  });
  backendProc.on('exit', (code) => {
    if (code && code !== 0) {
      // eslint-disable-next-line no-console
      console.error('[Forecaster Desktop] Backend exited with code', code);
    }
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexHtml = path.resolve(__dirname, '../frontend/dist/index.html');
  win.loadFile(indexHtml);
}

app.whenReady().then(() => {
  startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => {
  if (backendProc && !backendProc.killed) {
    backendProc.kill();
  }
});

