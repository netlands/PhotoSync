const {
    app,
    BrowserWindow,
    Menu
  } = require("electron");
const path = require('path');


Menu.setApplicationMenu(false);

function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 960,
    height: 980,
    minWidth: 960,
    minHeight: 980,
    backgroundColor: "black",
    resizable: true,
    icon: __dirname + '/camera.ico',
    webPreferences: {
        preload: path.join(__dirname, 'app.js')
    }    
})
  // mainWindow.loadURL('http://localhost:3000');
  mainWindow.loadFile(path.join(__dirname, 'start.html'));
  // mainWindow.openDevTools();
}

app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {

    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})


app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

// run with electron: npm start
// build using electron-packager: npx electron-packager . --overwrite --ignore=.gitignore --ignore=.+.lnk --ignore=.+.code-workspace --ignore=.+.bat --ignore=.gitattributes --ignore=^/art --ignore=^/test --icon='./camera.ico' 

