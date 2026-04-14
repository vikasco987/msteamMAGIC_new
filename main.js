const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const isDev = require('electron-is-dev');

let mainWindow;
let nextServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    title: "Lead Matrix Pro",
    // icon: path.join(__dirname, 'public/favicon.ico'), // Add your icon path here
  });

  // If in development, load from localhost:3000
  // In production, we assume next start has been called
  const url = isDev ? 'http://localhost:3000' : 'http://localhost:3000';
  
  mainWindow.loadURL(url);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Automatically open DevTools in dev mode
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

app.on('ready', () => {
  // Start Next.js server
  console.log('Starting Next.js server...');
  
  const command = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  nextServer = spawn(command, ['run', 'start'], {
    cwd: process.cwd(),
    shell: true,
    env: { ...process.env, NODE_ENV: 'production' }
  });

  nextServer.stdout.on('data', (data) => {
    console.log(`Next.js Output: ${data}`);
    // Wait for the server to be ready before creating window
    if (data.includes('ready on') || data.includes('started server on')) {
        if (!mainWindow) createWindow();
    }
  });

  nextServer.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });

  // Fallback if it takes too long
  setTimeout(() => {
    if (!mainWindow) createWindow();
  }, 10000);
});

app.on('window-all-closed', () => {
  if (nextServer) nextServer.kill();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
