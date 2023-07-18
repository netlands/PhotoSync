const { app, BrowserWindow, Menu } = require("electron");
const path = require("path");

app.disableHardwareAcceleration(); // for integrated Intel GPU

Menu.setApplicationMenu(false);

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 980,
    minWidth: 860,
    minHeight: 880,
    backgroundColor: "#000000",
    resizable: true,
    icon: __dirname + "/camera.ico",
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
      nodeIntegrationInWorker: true,      
      sandbox: false, //https://www.electronjs.org/blog/electron-20-0
      preload: path.join(__dirname, "app.js"),
    },
  });
  // mainWindow.loadURL('http://localhost:3000');
  mainWindow.loadFile(path.join(__dirname, "start.html"));
  mainWindow.openDevTools();
}

let myWindow = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (myWindow) {
      if (myWindow.isMinimized()) myWindow.restore();
      myWindow.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.whenReady().then(() => {
    myWindow = createWindow();
    app.on("activate", function () {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });
}

app.on("window-all-closed", function () {
  if (process.platform !== "darwin") app.quit();
});

// run with electron: npm start
// build using electron-packager: npx electron-packager . --overwrite --asar --ignore=.gitignore --ignore=.+.lnk --ignore=.+.code-workspace --ignore=.+.bat --ignore=.gitattributes --ignore=^/art --ignore=^/test --icon='./camera.ico'
