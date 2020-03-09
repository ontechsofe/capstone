const PREDICTION_RATE = 1000;


const {app, BrowserWindow, ipcMain, globalShortcut} = require('electron');
let mainWindow;
let child;

// internal coms between the interface and this server are through port 12345
// coms between the server and the data collection client are through 5555

const io = require('socket.io-client');
const socket = io.connect("http://localhost:12345/", {
    reconnection: true
});

let x = 0;
let y = 0;

let ready = false;

let STREAM_DATA_FLAG = false;

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
    socket.on('give prediction', (data) => {
        if (child) {
            child.webContents.send('give prediction', data);
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

    setInterval(() => {
        if (STREAM_DATA_FLAG) {
            mainWindow.webContents.send('give-image', {label: "PRE"});
        }
    }, PREDICTION_RATE);

    globalShortcut.register('CommandOrControl+p', () => {
        console.log("PREDICTION TIME");
        // Open Prediction window
        child = new BrowserWindow({
            modal: false,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                experimentalFeatures: true,
                nodeIntegration: true
            }
        });
        child.loadFile('./prediction.html');
        child.once('ready-to-show', () => {
            child.show();
        });
        child.on('closed', function () {
            child = null;
        });
    });

    globalShortcut.register('CommandOrControl+t', () => {
        console.log("TOGGLE STREAM =>", !STREAM_DATA_FLAG);
        STREAM_DATA_FLAG = !STREAM_DATA_FLAG;
    });

    let interval = null;

    [
        {
            key: 'num0',
            label: 'HUN'
        }
    ].forEach(e => {
        globalShortcut.register(e.key, () => {
            console.log(`[SEND] (${e.label}) ${++y}`);
            mainWindow.webContents.send('give-image', {label: e.label});
        });

        globalShortcut.register(`CommandOrControl+${e.key}`, () => {
            console.log(`[TOGL] (${e.label})`);
            if (interval === null) {
                interval = setInterval(() => {
                    console.log(`[SEND] (${e.label}) ${++y}`);
                    mainWindow.webContents.send('give-image', {label: e.label});
                }, 1000 + (500 - (Math.random() * 1000)))
            } else {
                clearInterval(interval);
                interval = null;
            }
        });
    });

    globalShortcut.register('CommandOrControl+r', () => {
        x = 0;
        y = 0;
        console.log(`RESET COUNTS`);
    });

    globalShortcut.register('CommandOrControl+q', () => {
        console.clear();
    });

    globalShortcut.register('CommandOrControl+s', () => {
        console.log("[SAVE] SAVE DATA");
        socket.emit('send-save', true);
    });

    globalShortcut.register('CommandOrControl+z', () => {
        console.log("[SAVE] SAVE PREDICTION");
        socket.emit('send-predict-save', true);
    });

    globalShortcut.register('CommandOrControl+Space', () => {
        console.log("[NOPE] FORCE DISCONNECT");
        socket.emit('send-disconnect', true);
    });

    globalShortcut.register('CommandOrControl+v', () => {
        console.log("[PAIN] SENDING PAIN");
        socket.emit('send-pain', true);
    });

    ipcMain.on('got-image', (event, arg) => {
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
});
