const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron');
let mainWindow;

// internal coms between the interface and this server are through port 12345
// coms between the server and the data collection client are through 5555

const io = require('socket.io-client');
const socket = io.connect("http://localhost:12345/", {
    reconnection: true
});

let ready = false;

socket.on('connect', () => {
    console.log('connected to localhost:12345');
    socket.on('graph-sample', (data) => {
        if (ready && mainWindow !== null) {
            mainWindow.webContents.send('graph-sample', data);
        }
    });
    socket.on('image-data', (data) => {
        if (ready && mainWindow !== null) {
            mainWindow.webContents.send('image-data', data);
        }
    });
});

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            experimentalFeatures: true,
            nodeIntegration: true
        }
    });

    globalShortcut.register('num0', () => {
        console.log("CONCENTRATE");
        mainWindow.webContents.send('give-image', {label: "FOC"});
    });

    globalShortcut.register('num1', () => {
        console.log("NOT CONCENTRATE");
        mainWindow.webContents.send('give-image', {label: "REL"});
    });

    globalShortcut.register('Space', () => {
        console.log("SAVE DATA");
        socket.emit('send-save', true);
    });

    globalShortcut.register('CommandOrControl+Space', () => {
        console.log("FORCE DISCONNECT");
        socket.emit('send-disconnect', true);
    });

    ipcMain.on('got-image', (event, arg) => {
        console.log("GOT DATA");
        socket.emit('image', arg);
    });

    mainWindow.loadFile('index.html');
    mainWindow.setMenu(null);
    mainWindow.removeMenu();
    mainWindow.setMenuBarVisibility(false);

    // Open the DevTools.
    // mainWindow.webContents.openDevTools()

    mainWindow.once("ready-to-show", () => {
        mainWindow.show();
        mainWindow.focus();
        ready = true;
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.on('ready', createWindow);

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', function () {
    if (mainWindow === null) createWindow()
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
})
