const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const fs = require('fs');

let mainWindow;
let serverProcess;

// Basic logging setup (safe to run at top level)
// Configure Portable Data Path (Must be done before accessing userData)
if (process.env.PORTABLE_EXECUTABLE_DIR) {
    // Running as generic Portable App (e.g. from Flash Drive)
    app.setPath('userData', path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'gomaadb_data'));
} else if (process.platform === 'win32' && app.isPackaged) {
    // Running as installed/unpacked on Windows - keep data with exe
    app.setPath('userData', path.join(path.dirname(app.getPath('exe')), 'gomaadb_data'));
}

const userDataPath = app.getPath('userData');
const logPath = path.join(userDataPath, 'main-process.log');
let logStream;

function log(msg) {
    const line = `[${new Date().toISOString()}] ${msg}\n`;
    if (logStream) logStream.write(line);
    console.log(line);
}

// Global error handlers
process.on('uncaughtException', (error) => {
    log(`CRITICAL: Uncaught Exception: ${error.stack}`);
    try {
        dialog.showErrorBox('Critical Error', `Uncaught Exception:\n${error.message}\n\nCheck logs at: ${logPath}`);
    } catch (e) { }
    app.quit();
});

process.on('unhandledRejection', (reason, promise) => {
    log(`CRITICAL: Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

function initLogging() {
    try {
        if (!fs.existsSync(userDataPath)) {
            fs.mkdirSync(userDataPath, { recursive: true });
        }
        logStream = fs.createWriteStream(logPath, { flags: 'a' });
        log('--- App Session Start ---');
        log(`Platform: ${process.platform}`);
        log(`Arch: ${process.arch}`);
        log(`App Packaged: ${app.isPackaged}`);
        log(`User Data Path: ${userDataPath}`);
    } catch (err) {
        console.error('Failed to init logging:', err);
    }
}

function createWindow() {
    log('Creating main window...');
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
        },
        icon: app.isPackaged
            ? path.join(__dirname, '../client/dist/logo.png')
            : path.join(__dirname, '../client/public/logo.png'),
    });

    const isDev = !app.isPackaged;
    const startUrl = isDev
        ? 'http://localhost:5173'
        : `file://${path.join(__dirname, '../client/dist/index.html')}`;

    log(`Loading URL: ${startUrl}`);
    mainWindow.loadURL(startUrl);

    mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
        log(`FAILED TO LOAD: ${errorCode} - ${errorDescription}`);
    });

    // Handle Downloads explicitly
    // Handle Downloads explicitly
    mainWindow.webContents.session.on('will-download', (event, item, webContents) => {
        const filename = item.getFilename().toLowerCase();
        let filters = [];

        if (filename.endsWith('.pdf')) {
            filters = [{ name: 'PDF Files', extensions: ['pdf'] }];
        } else if (filename.endsWith('.sqlite')) {
            filters = [{ name: 'Database Files', extensions: ['sqlite'] }];
        } else if (filename.endsWith('.csv')) {
            filters = [{ name: 'CSV Files', extensions: ['csv'] }];
        } else {
            filters = [{ name: 'All Files', extensions: ['*'] }];
        }

        item.setSaveDialogOptions({
            title: `Save ${filename}`,
            defaultPath: item.getFilename(),
            filters: filters
        });

        item.on('updated', (event, state) => {
            if (state === 'interrupted') {
                log('Download is interrupted but can be resumed');
            } else if (state === 'progressing') {
                if (item.isPaused()) {
                    log('Download is paused');
                } else {
                    log(`Received bytes: ${item.getReceivedBytes()}`);
                }
            }
        });
        item.once('done', (event, state) => {
            if (state === 'completed') {
                log('Download successfully');
            } else {
                log(`Download failed: ${state}`);
            }
        });
    });

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

function startServer() {
    const serverPath = path.join(__dirname, '../server/index.js');
    const cwd = path.join(__dirname, '../server');
    const dbPath = path.join(userDataPath, 'gomaadb.sqlite');

    log(`Verifying server path: ${serverPath}`);
    if (!fs.existsSync(serverPath)) {
        const errorMsg = `Server file not found at: ${serverPath}`;
        log(`ERROR: ${errorMsg}`);
        dialog.showErrorBox('Server Error', errorMsg);
        return;
    }

    log(`Starting server. DB Path: ${dbPath}`);

    try {
        serverProcess = fork(serverPath, [], {
            cwd: cwd,
            stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
            env: {
                ...process.env,
                DATABASE_PATH: dbPath,
                USER_DATA_PATH: userDataPath,
                PORT: 3001,
                ELECTRON_RUN_AS_NODE: '1'
            }
        });

        serverProcess.stdout.on('data', (data) => log(`SERVER STDOUT: ${data}`));
        serverProcess.stderr.on('data', (data) => log(`SERVER STDERR: ${data}`));

        serverProcess.on('error', (err) => {
            log(`SERVER PROCESS ERROR: ${err.message}`);
            dialog.showErrorBox('Server Process Error', err.message);
        });

        serverProcess.on('exit', (code, signal) => {
            log(`SERVER PROCESS EXIT: code=${code}, signal=${signal}`);
            if (code === 99) {
                log('Server requested restart (Restore operation). Restarting...');
                startServer(); // Restart server
            } else if (code !== 0 && code !== null) {
                // If exit code 1, it might be port conflict
                dialog.showErrorBox('Server Start Failed',
                    `The backend server failed to start (Code ${code}).\n\n` +
                    `Common Cause: Another instance of the app (or terminal) is already running on Port 3001.\n\n` +
                    `Please close all other windows/terminals and try again.\n` +
                    `Check logs at: ${logPath}`
                );
            }
        });
    } catch (err) {
        log(`FORK ERROR: ${err.message}`);
        dialog.showErrorBox('Fork Error', err.message);
    }
}

app.on('ready', () => {
    initLogging();
    log('App ready. Starting initialization...');
    startServer();
    createWindow();
});

app.on('window-all-closed', function () {
    log('All windows closed.');
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
    if (mainWindow === null) createWindow();
});

app.on('before-quit', () => {
    log('App quitting. Cleaning up...');
    if (serverProcess) {
        serverProcess.kill();
    }
});

