const { app, BrowserWindow } = require('electron');
const path = require('path');

// Try to load env variables
require('dotenv').config({ path: path.join(__dirname, '.env') });

function startExpressServer() {
  try {
    // Start our bundles Express server in the background
    require(path.join(__dirname, 'dist', 'server.cjs'));
    console.log("Express server successfully started inside Electron process.");
  } catch (err) {
    console.error("Express server startup error:", err);
  }
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 1024,
    minHeight: 600,
    title: "Voyage Retrogaming & Input Emulator",
    autoHideMenuBar: true,
    backgroundColor: "#0d0f12",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  // Load the web page from the local Express server on port 3000
  mainWindow.loadURL('http://localhost:3000').catch((err) => {
    console.error("Failed to load page, retrying...", err);
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 1000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  startExpressServer();
  // Allow the Express server a tiny moment to bind the port
  setTimeout(createWindow, 800);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
