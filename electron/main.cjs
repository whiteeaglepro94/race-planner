const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

const CLIENT_PORT = 3000;
const WS_PORT = 3001;

let mainWindow;
let httpServer;

const isPackaged = app.isPackaged;
const rootDir = isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..');

// Log to file for debugging in packaged mode
const logPath = path.join(app.getPath('userData'), 'race-planner.log');
const logStream = fs.createWriteStream(logPath, { flags: 'w' });
function log(...args) {
  const line = `[${new Date().toISOString()}] ${args.join(' ')}`;
  console.log(line);
  logStream.write(line + '\n');
}
log('Starting Race Planner');
log('isPackaged:', isPackaged);
log('rootDir:', rootDir);

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function startStaticServer() {
  const clientDir = path.join(rootDir, 'packages', 'client', 'dist');

  httpServer = http.createServer((req, res) => {
    const url = req.url.split('?')[0];
    let filePath = path.join(clientDir, url === '/' ? 'index.html' : url);

    if (!fs.existsSync(filePath)) {
      filePath = path.join(clientDir, 'index.html');
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    try {
      const data = fs.readFileSync(filePath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  httpServer.listen(CLIENT_PORT, () => {
    console.log(`Client served on http://localhost:${CLIENT_PORT}`);
  });
}

async function startWsServer() {
  try {
    const bundlePath = path.join(rootDir, 'packages', 'server', 'dist', 'bundle.cjs');
    log('Bundle path:', bundlePath, 'exists:', fs.existsSync(bundlePath));
    if (fs.existsSync(bundlePath)) {
      const server = require(bundlePath);
      log('Bundle loaded, exports:', Object.keys(server));

      // Inject irsdk-node native module (require works in CJS context)
      try {
        const irsdkPath = path.join(rootDir, 'node_modules', 'irsdk-node');
        log('irsdk-node path:', irsdkPath, 'exists:', fs.existsSync(irsdkPath));
        if (fs.existsSync(irsdkPath)) {
          const irsdk = require(irsdkPath);
          log('irsdk-node loaded, exports:', Object.keys(irsdk));
          server.injectIracingSDK(irsdk);
          log('irsdk-node injected successfully');
        } else {
          log('irsdk-node NOT FOUND at', irsdkPath);
        }
      } catch (err) {
        log('irsdk-node injection FAILED:', err.message);
        log('Stack:', err.stack);
      }

      await server.createServer(WS_PORT);
      log('WebSocket server on port', WS_PORT);
    } else {
      log('ERROR: bundle.mjs not found');
    }
  } catch (err) {
    log('WebSocket server error:', err.message);
    log('Stack:', err.stack);
  }
}

function createWindow() {
  const iconPath = path.join(rootDir, 'build', 'icon.ico');

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 600,
    icon: iconPath,
    title: 'Race Planner',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadURL(`http://localhost:${CLIENT_PORT}`);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  startStaticServer();
  await startWsServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (httpServer) httpServer.close();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
