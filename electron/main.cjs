const { app, BrowserWindow, ipcMain, session } = require('electron');
const path = require('path');
const http = require('http');
const https = require('https');
const fs = require('fs');

const CLIENT_PORT = 3000;
const WS_PORT = 3001;

let mainWindow;
let httpServer;

const isPackaged = app.isPackaged;
const rootDir = isPackaged ? path.join(process.resourcesPath, 'app') : path.join(__dirname, '..');

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
    if (!fs.existsSync(filePath)) filePath = path.join(clientDir, 'index.html');
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
      log('ERROR: bundle.cjs not found');
    }
  } catch (err) {
    log('WebSocket server error:', err.message);
    log('Stack:', err.stack);
  }
}

function createWindow() {
  const iconPath = path.join(rootDir, 'build', 'icon.ico');
  mainWindow = new BrowserWindow({
    width: 1400, height: 900, minWidth: 1000, minHeight: 600,
    icon: iconPath, title: 'Race Planner', autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });
  mainWindow.loadURL(`http://localhost:${CLIENT_PORT}`);
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── HTTPS helper ─────────────────────────────────────────────────────
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers,
    }, (res) => {
      let body = '';
      res.on('data', (c) => { body += c; });
      res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
    });
    req.on('error', reject);
    req.end();
  });
}

// ─── iRacing Data API ─────────────────────────────────────────────────
let loginSessionCounter = 0;
let iracingToken = null;
let iracingHiddenWin = null;

async function fetchViaBrowser(endpoint) {
  if (!iracingHiddenWin || iracingHiddenWin.isDestroyed()) {
    return { error: 'Non connecté à iRacing' };
  }
  const safeEndpoint = JSON.stringify(String(endpoint));
  return iracingHiddenWin.webContents.executeJavaScript(`
    (async () => {
      try {
        const opts = { headers: { 'ir-client-id': 'iracing_ui' } };
        // Try BFF proxy first, then direct /data/
        let res = await fetch('/bff/pub/proxy/data/' + ${safeEndpoint}, opts);
        if (res.status === 404 || res.status === 403) {
          res = await fetch('/data/' + ${safeEndpoint}, opts);
        }
        if (!res.ok) return { error: 'HTTP ' + res.status, status: res.status };
        const json = await res.json();
        if (json.link) {
          const s3 = await fetch(json.link);
          if (!s3.ok) return { error: 'S3 HTTP ' + s3.status };
          return { data: await s3.json() };
        }
        return { data: json };
      } catch (e) {
        return { error: e.message };
      }
    })()
  `);
}

async function fetchViaToken(endpoint) {
  const res = await httpsGet(
    `https://members-ng.iracing.com/data/${endpoint}`,
    { 'Authorization': iracingToken }
  );
  if (res.status === 401) {
    iracingToken = null;
    return { error: 'Session expirée — reconnectez-vous', status: 401 };
  }
  if (res.status !== 200) {
    return { error: `Erreur API iRacing: HTTP ${res.status}` };
  }
  const json = JSON.parse(res.body);
  if (json.link) {
    const s3Res = await httpsGet(json.link);
    if (s3Res.status !== 200) return { error: `Erreur S3: HTTP ${s3Res.status}` };
    return { data: JSON.parse(s3Res.body) };
  }
  return { data: json };
}

ipcMain.handle('iracing-fetch', async (_event, endpoint) => {
  if (!iracingToken) {
    return { error: 'Non connecté à iRacing' };
  }
  try {
    let result;
    if (iracingToken === '__BROWSER__') {
      result = await fetchViaBrowser(endpoint);
    } else {
      result = await fetchViaToken(endpoint);
    }
    log('iracing-fetch', endpoint, result.error || 'OK');
    return result;
  } catch (err) {
    log('iracing-fetch error:', err.message);
    return { error: err.message };
  }
});

ipcMain.handle('iracing-logout', () => {
  iracingToken = null;
  if (iracingHiddenWin && !iracingHiddenWin.isDestroyed()) {
    iracingHiddenWin.close();
  }
  iracingHiddenWin = null;
  return { success: true };
});

ipcMain.handle('iracing-login', async () => {
  iracingToken = null;
  if (iracingHiddenWin && !iracingHiddenWin.isDestroyed()) {
    iracingHiddenWin.close();
  }
  iracingHiddenWin = null;
  loginSessionCounter++;
  const partition = `persist:iracing-login-${loginSessionCounter}`;
  const loginSession = session.fromPartition(partition);
  await loginSession.clearStorageData();

  return new Promise((resolve) => {
    const loginWin = new BrowserWindow({
      width: 900, height: 700,
      title: 'Connexion iRacing — connectez-vous puis la fenêtre se fermera',
      autoHideMenuBar: true, parent: mainWindow, modal: true,
      webPreferences: { nodeIntegration: false, contextIsolation: true, partition },
    });

    loginWin.loadURL('https://members-ng.iracing.com');

    let resolved = false;
    let testing = false;
    let loggedHeaders = new Set();

    // ── Intercept ALL requests to capture auth headers ──
    loginSession.webRequest.onBeforeSendHeaders(
      { urls: ['https://*.iracing.com/*'] },
      (details, callback) => {
        if (!resolved) {
          const headerNames = Object.keys(details.requestHeaders);
          const key = details.url.substring(0, 60) + '|' + headerNames.sort().join(',');
          if (!loggedHeaders.has(key)) {
            loggedHeaders.add(key);
            log('REQ', details.method, details.url.substring(0, 80));
            log('  HEADERS:', headerNames.join(', '));
          }

          const auth = details.requestHeaders['Authorization'] || details.requestHeaders['authorization'];
          if (auth && !testing) {
            log('AUTH HEADER FOUND:', auth.substring(0, 50) + '...');
            testing = true;
            testToken(auth).then(() => { testing = false; });
          }
        }
        callback({ requestHeaders: details.requestHeaders });
      }
    );

    async function testToken(authHeader) {
      if (resolved) return;
      try {
        const res = await httpsGet('https://members-ng.iracing.com/data/doc', {
          'Authorization': authHeader,
        });
        log('Data API test with token: HTTP', res.status);
        if (res.status === 200) {
          resolved = true;
          iracingToken = authHeader;
          cleanup();
          loginWin.close();
          resolve({ success: true });
        }
      } catch (err) {
        log('Token test error:', err.message);
      }
    }

    // ── Fallback: try executeJavaScript AFTER OAuth completes ──
    let oauthSeen = false;
    let postLoginScheduled = false;
    let fallbackAttempts = 0;
    const MAX_FALLBACK_ATTEMPTS = 6;

    function checkNavigation(url) {
      if (url.includes('oauth.iracing.com')) {
        oauthSeen = true;
        log('OAuth page detected');
      }
      if (oauthSeen && url.includes('members-ng.iracing.com') && !postLoginScheduled && !resolved) {
        postLoginScheduled = true;
        log('Post-login return to members-ng detected, scheduling fallback in 5s');
        setTimeout(tryExecuteJsFallback, 5000);
      }
    }

    loginWin.webContents.on('did-navigate-in-page', (_ev, url) => {
      log('SPA nav:', url.substring(0, 100));
      checkNavigation(url);
    });

    loginWin.webContents.on('did-navigate', (_ev, url) => {
      log('Full nav:', url.substring(0, 100));
      checkNavigation(url);
    });

    loginWin.webContents.on('did-finish-load', () => {
      const url = loginWin.webContents.getURL();
      log('Page loaded:', url.substring(0, 100));
      checkNavigation(url);
    });

    async function tryExecuteJsFallback() {
      if (resolved || loginWin.isDestroyed()) return;
      fallbackAttempts++;
      const currentUrl = loginWin.webContents.getURL();
      log(`Fallback attempt ${fallbackAttempts}/${MAX_FALLBACK_ATTEMPTS}, URL: ${currentUrl.substring(0, 80)}`);

      if (!currentUrl.includes('members-ng.iracing.com')) {
        log('Not on members-ng yet, retrying in 3s...');
        if (fallbackAttempts < MAX_FALLBACK_ATTEMPTS) {
          setTimeout(tryExecuteJsFallback, 3000);
        }
        return;
      }

      log('Testing BFF endpoints...');
      try {
        const result = await loginWin.webContents.executeJavaScript(`
          (async () => {
            const tests = {};
            const opts = { headers: { 'ir-client-id': 'iracing_ui' } };
            try {
              const r1 = await fetch('/bff/pub/proxy/api/sessions', opts);
              tests.bff_sessions = { status: r1.status, ok: r1.ok };
            } catch (e) { tests.bff_sessions = { error: e.message }; }
            try {
              const r2 = await fetch('/bff/pub/proxy/api/sessions');
              tests.bff_sessions_no_hdr = { status: r2.status, ok: r2.ok };
            } catch (e) { tests.bff_sessions_no_hdr = { error: e.message }; }
            try {
              const r3 = await fetch('/bff/pub/proxy/data/series/seasons', opts);
              tests.bff_series = { status: r3.status, ok: r3.ok };
            } catch (e) { tests.bff_series = { error: e.message }; }
            try {
              const r4 = await fetch('/bff/pub/proxy/data/doc', opts);
              tests.bff_doc = { status: r4.status, ok: r4.ok };
            } catch (e) { tests.bff_doc = { error: e.message }; }
            return tests;
          })()
        `);
        log('BFF discovery:', JSON.stringify(result));

        const anyOk = result && Object.values(result).some(r => r && r.ok);
        if (anyOk) {
          resolved = true;
          iracingToken = '__BROWSER__';
          iracingHiddenWin = loginWin;
          cleanup();
          loginWin.hide();
          log('Auth confirmed via BFF — window hidden');
          resolve({ success: true });
        } else if (fallbackAttempts < MAX_FALLBACK_ATTEMPTS) {
          log('No BFF endpoint accessible yet, retrying in 4s...');
          setTimeout(tryExecuteJsFallback, 4000);
        } else {
          log('All endpoints inaccessible after max attempts');
        }
      } catch (err) {
        log('BFF discovery error:', err.message);
        if (fallbackAttempts < MAX_FALLBACK_ATTEMPTS) {
          setTimeout(tryExecuteJsFallback, 3000);
        }
      }
    }

    function cleanup() {
      clearInterval(checkInterval);
      try { loginSession.webRequest.onBeforeSendHeaders(null); } catch {}
    }

    const checkInterval = setInterval(async () => {
      if (resolved) { cleanup(); return; }
    }, 10000);

    loginWin.on('closed', () => {
      cleanup();
      if (!resolved) {
        resolved = true;
        resolve({ success: false });
      }
    });
  });
});

app.on('ready', async () => {
  startStaticServer();
  await startWsServer();
  createWindow();
});

app.on('window-all-closed', () => {
  if (iracingHiddenWin && !iracingHiddenWin.isDestroyed()) {
    iracingHiddenWin.close();
    iracingHiddenWin = null;
  }
  if (httpServer) httpServer.close();
  app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) createWindow();
});
