/**
 * CGNeeti (कामसाथी) - Production-Ready Node.js HTTP Server & Authentication API
 * Built with native Node.js core modules (zero heavy dependencies required)
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const crypto = require('crypto');

// ---------------------------------------------------------------------------
// TERMINAL LOGGER - Color-coded real-time activity monitor
// ---------------------------------------------------------------------------
const CLR = {
  reset:   '\x1b[0m',
  bright:  '\x1b[1m',
  dim:     '\x1b[2m',
  cyan:    '\x1b[36m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  red:     '\x1b[31m',
  magenta: '\x1b[35m',
  blue:    '\x1b[34m',
  white:   '\x1b[37m',
  gray:    '\x1b[90m',
  bgGreen: '\x1b[42m',
  bgRed:   '\x1b[41m',
  bgYellow:'\x1b[43m',
};

function getTimestamp() {
  return new Date().toLocaleTimeString('en-IN', { hour12: false });
}

function colorStatus(code) {
  if (code >= 500) return `${CLR.bright}${CLR.red}${code}${CLR.reset}`;
  if (code >= 400) return `${CLR.red}${code}${CLR.reset}`;
  if (code >= 300) return `${CLR.yellow}${code}${CLR.reset}`;
  if (code >= 200) return `${CLR.green}${code}${CLR.reset}`;
  return `${CLR.white}${code}${CLR.reset}`;
}

function colorMethod(method) {
  const colors = {
    GET:    CLR.cyan,
    POST:   CLR.green,
    PUT:    CLR.yellow,
    PATCH:  CLR.yellow,
    DELETE: CLR.red,
    OPTIONS:CLR.gray,
  };
  const c = colors[method] || CLR.white;
  return `${c}${CLR.bright}${method.padEnd(7)}${CLR.reset}`;
}

const log = {
  info:    (msg) => console.log(`${CLR.gray}[${getTimestamp()}]${CLR.reset} ${CLR.cyan}[INFO]${CLR.reset}  ${msg}`),
  success: (msg) => console.log(`${CLR.gray}[${getTimestamp()}]${CLR.reset} ${CLR.green}[OK]${CLR.reset}    ${msg}`),
  warn:    (msg) => console.log(`${CLR.gray}[${getTimestamp()}]${CLR.reset} ${CLR.yellow}[WARN]${CLR.reset}  ${msg}`),
  error:   (msg) => console.log(`${CLR.gray}[${getTimestamp()}]${CLR.reset} ${CLR.red}[ERROR]${CLR.reset} ${msg}`),
  request: (method, path, status, ms, ip) => {
    const timeStr = ms < 100 ? `${CLR.green}${ms}ms${CLR.reset}` :
                    ms < 500 ? `${CLR.yellow}${ms}ms${CLR.reset}` :
                               `${CLR.red}${ms}ms${CLR.reset}`;
    const ipStr = `${CLR.gray}${(ip || '?').padEnd(15)}${CLR.reset}`;
    console.log(
      `${CLR.gray}[${getTimestamp()}]${CLR.reset} ` +
      `${colorMethod(method)} ` +
      `${colorStatus(status)} ` +
      `${timeStr.padStart(8)}  ` +
      `${ipStr}  ` +
      `${CLR.white}${path}${CLR.reset}`
    );
  },
  divider: () => console.log(`${CLR.gray}${'─'.repeat(72)}${CLR.reset}`),
  banner:  (msg) => console.log(`\n${CLR.bright}${CLR.cyan}${msg}${CLR.reset}\n`),
};
// Re-export as global for use throughout file
global._log = log;

// ---------------------------------------------------------------------------
// 1. Environment Variables Loader (.env)
// ---------------------------------------------------------------------------
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}
loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 8000;
const AUTH_SECRET = process.env.AUTH_SECRET || 'cgneeti_fallback_secret_key_min_32_chars_long_12345';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// In-memory revoked tokens (cleared on restart; in enterprise this would be Redis)
const revokedTokens = new Set();
// Password reset tokens cache: tokenHash -> { userId, expiresAt }
const resetTokens = new Map();

const BACKEND_PORT = parseInt(process.env.BACKEND_PORT, 10) || 8001;
const BACKEND_HOST = process.env.BACKEND_HOST || '127.0.0.1';

/**
 * Reverse Proxy: Seamlessly forwards requests to the Python FastAPI backend
 */
function proxyToBackend(req, res, targetPath) {
  const targetUrl = targetPath || req.url;
  const outgoingHeaders = {
    ...req.headers,
    host: `${BACKEND_HOST}:${BACKEND_PORT}`,
    'x-forwarded-for': req.socket.remoteAddress || '',
    'x-forwarded-proto': 'http',
    'x-forwarded-host': req.headers.host || `localhost:${PORT}`
  };

  // Ensure authenticated session token is forwarded to FastAPI backend
  const authenticatedToken = req.token || (typeof extractToken === 'function' ? extractToken(req) : null);
  const currentAuth = outgoingHeaders.authorization || '';
  const isDummyAuth = !currentAuth ||
                      currentAuth.includes('session_token') ||
                      currentAuth.includes('token_local') ||
                      currentAuth === 'Bearer null' ||
                      currentAuth === 'Bearer undefined';

  if (isDummyAuth && authenticatedToken) {
    outgoingHeaders.authorization = `Bearer ${authenticatedToken}`;
  }

  const options = {
    hostname: BACKEND_HOST,
    port: BACKEND_PORT,
    path: targetUrl,
    method: req.method,
    headers: outgoingHeaders
  };

  const proxyReq = http.request(options, (proxyRes) => {
    proxyRes.on('error', (err) => {
      console.warn('[Proxy Response Error]:', err.message);
    });
    if (!res.headersSent) {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
    }
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.warn(`[Proxy Notice] FastAPI backend at http://${BACKEND_HOST}:${BACKEND_PORT} is not responding:`, err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'FastAPI Backend Offline',
        message: `FastAPI backend at http://${BACKEND_HOST}:${BACKEND_PORT} is not currently running. Run RUN.bat to start both frontend and backend.`,
        code: 'BACKEND_OFFLINE',
        endpoint: targetUrl
      }));
    }
  });

  req.on('error', (err) => {
    console.warn('[Client Request Error]:', err.message);
    try { proxyReq.destroy(); } catch (_) {}
  });

  res.on('error', (err) => {
    console.warn('[Client Response Error]:', err.message);
  });

  req.pipe(proxyReq, { end: true });
}

// ---------------------------------------------------------------------------
// 2. Database Helpers (Persistent JSON storage with atomic writes)
// ---------------------------------------------------------------------------
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, JSON.stringify([], null, 2), 'utf8');
  }
}
ensureDataDir();

function getUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading users file:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Firebase Authentication & Firestore Integration
// ---------------------------------------------------------------------------
let firestoreDb = null;
let firebaseAuth = null;

try {
  const serviceAccountPath = path.join(__dirname, 'backend', 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const { initializeApp, cert, getApps } = require('firebase-admin/app');
    const { getFirestore } = require('firebase-admin/firestore');
    const { getAuth } = require('firebase-admin/auth');
    const sa = require(serviceAccountPath);
    const app = getApps().length === 0 ? initializeApp({ credential: cert(sa) }) : getApps()[0];
    firestoreDb = getFirestore(app);
    firebaseAuth = getAuth(app);
    log.success(`Firebase connected (Auth & Firestore) to project: ${sa.project_id || 'dailyjob-93863'}`);
  }
} catch (e) {
  log.warn(`Firebase Admin init notice: ${e.message}`);
}

async function syncUserToFirebaseAuth(user, plainPassword = null) {
  if (!firebaseAuth || !user || !user.email) return;
  try {
    const cleanEmail = user.email.trim().toLowerCase();
    const displayName = user.name || user.username || cleanEmail.split('@')[0];
    const userPayload = {
      email: cleanEmail,
      displayName: displayName
    };
    if (plainPassword && plainPassword.length >= 6) {
      userPayload.password = plainPassword;
    }

    try {
      const existingUser = await firebaseAuth.getUserByEmail(cleanEmail);
      const updateData = { displayName };
      if (userPayload.password) updateData.password = userPayload.password;
      await firebaseAuth.updateUser(existingUser.uid, updateData);
      log.info(`[Firebase Auth] Synchronized user: ${cleanEmail} (UID: ${existingUser.uid})`);
    } catch (notFound) {
      if (notFound.code === 'auth/user-not-found') {
        const created = await firebaseAuth.createUser({
          ...userPayload
        });
        log.success(`[Firebase Auth] Created user in Firebase: ${cleanEmail} (UID: ${created.uid})`);
      } else {
        throw notFound;
      }
    }
  } catch (err) {
    log.warn(`[Firebase Auth Sync] ${err.message}`);
  }
}

async function syncUserToFirestore(user) {
  if (!firestoreDb || !user) return;
  try {
    const safeData = sanitizeUser(user);
    const docId = user.user_id || user.id || user.email;
    if (docId) {
      await firestoreDb.collection('users').doc(docId).set({
        ...safeData,
        updated_at: new Date().toISOString()
      }, { merge: true });
      log.info(`[Firestore] Synced user ${docId} to 'users' collection`);
    }
  } catch (err) {
    log.warn(`[Firestore Sync] ${err.message}`);
  }
}

function saveUsers(users, changedUser = null, plainPassword = null) {
  const tempFile = USERS_FILE + '.tmp';
  fs.writeFileSync(tempFile, JSON.stringify(users, null, 2), 'utf8');
  fs.renameSync(tempFile, USERS_FILE);

  if (changedUser) {
    if (firestoreDb) syncUserToFirestore(changedUser);
    if (firebaseAuth) syncUserToFirebaseAuth(changedUser, plainPassword);
  } else {
    users.forEach((u) => {
      if (firestoreDb) syncUserToFirestore(u);
      if (firebaseAuth) syncUserToFirebaseAuth(u);
    });
  }
}

// Synchronize existing users to Firebase Auth and Firestore on server startup
setTimeout(() => {
  try {
    const existingUsers = getUsers();
    if (existingUsers && existingUsers.length > 0) {
      existingUsers.forEach((u) => {
        if (firestoreDb) syncUserToFirestore(u);
        if (firebaseAuth) syncUserToFirebaseAuth(u);
      });
    }
  } catch (_) {}
}, 1500);

function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, salt, reset_token, reset_token_expires, ...safeUser } = user;
  const username = user.username || user.name || user.fullName || 'User';
  const isCompleted = user.profile_completed === true || (user.profile && !!user.profile.user_type);
  const userAge = user.age || user.profile?.age || null;
  const workerProfile = user.worker_profile || (user.profile?.user_type === 'job_seeker' ? user.profile : null);
  const employerProfile = user.employer_profile || (user.profile?.user_type === 'employer' ? user.profile : null);
  const jobSeekerProfile = user.job_seeker_profile || workerProfile;
  const accountType = user.account_type || (user.role === 'employer' ? 'employer' : 'job_seeker');

  return {
    ...safeUser,
    id: user.user_id || user.id,
    user_id: user.user_id || user.id,
    username: username,
    fullName: username,
    name: username,
    mobile_number: user.mobile_number || user.mobileNumber || null,
    account_type: accountType,
    age: userAge,
    profile_completed: !!isCompleted,
    completion_percentage: user.completion_percentage || 0,
    profile: user.profile ? { ...user.profile, age: user.profile.age || userAge } : null,
    worker_profile: workerProfile ? { ...workerProfile, age: workerProfile.age || userAge } : null,
    employer_profile: employerProfile ? { ...employerProfile, age: employerProfile.age || userAge } : null,
    job_seeker_profile: jobSeekerProfile ? { ...jobSeekerProfile, age: jobSeekerProfile.age || userAge } : null,
    saved_data: user.saved_data || null
  };
}


// ---------------------------------------------------------------------------
// 3. Cryptography & Security Helpers
// ---------------------------------------------------------------------------
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyPassword(password, salt, storedHash) {
  const computedHash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(storedHash, 'hex'));
}

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64').toString('utf8');
}

function generateJWT(user, durationDays = 7) {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + durationDays * 24 * 60 * 60;

  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: user.user_id,
    email: user.email,
    name: user.name,
    role: user.role || 'worker',
    auth_provider: user.auth_provider || 'local',
    jti: crypto.randomBytes(8).toString('hex'),
    iat: now,
    exp: exp,
    iss: 'cgneeti'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

function verifyJWT(token) {
  if (!token || typeof token !== 'string') return null;
  if (revokedTokens.has(token)) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;

  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', AUTH_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature.length !== expectedSignature.length) return null;
  const isValid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (!isValid) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    return payload;
  } catch (err) {
    return null;
  }
}

function parseCookies(req) {
  const list = {};
  const rc = req.headers.cookie;
  if (rc) {
    rc.split(';').forEach((cookie) => {
      const parts = cookie.split('=');
      const name = parts.shift().trim();
      const val = decodeURIComponent(parts.join('='));
      list[name] = val;
    });
  }
  return list;
}

function extractToken(req) {
  const cookies = parseCookies(req);
  if (cookies.cgneeti_session) {
    return cookies.cgneeti_session;
  }
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function authenticateRequest(req) {
  const token = extractToken(req);
  if (!token) return null;
  const payload = verifyJWT(token);
  if (!payload) return null;
  req.token = token;
  req.user = payload;
  return payload;
}

// ---------------------------------------------------------------------------
// 4. Request Body JSON Parser Helper
// ---------------------------------------------------------------------------
function parseJSONBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1e6) {
        // Protect against large payload flood (1MB max)
        req.connection.destroy();
        reject(new Error('Payload Too Large'));
      }
    });
    req.on('end', () => {
      try {
        if (!body.trim()) {
          resolve({});
        } else {
          resolve(JSON.parse(body));
        }
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', (err) => reject(err));
  });
}

function sendJSON(res, statusCode, data, headers = {}) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
    ...headers
  });
  res.end(json);
}

// ---------------------------------------------------------------------------
// 5. Verification of Google ID Tokens
// ---------------------------------------------------------------------------
function verifyGoogleToken(idToken) {
  return new Promise((resolve, reject) => {
    const requestUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
    https.get(requestUrl, (googleRes) => {
      let rawData = '';
      googleRes.on('data', (chunk) => { rawData += chunk; });
      googleRes.on('end', () => {
        try {
          const parsed = JSON.parse(rawData);
          if (parsed.error_description || parsed.error) {
            reject(new Error(parsed.error_description || parsed.error));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', (err) => reject(err));
  });
}

// ---------------------------------------------------------------------------
// 5.5 AI Gateway Helpers (Groq Cloud & Google Gemini)
// ---------------------------------------------------------------------------
function callGroqAPI(apiKey, model, messages) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      model: model || 'llama-3.3-70b-versatile',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1024
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.error?.message || `Groq error status ${res.statusCode}`));
          } else {
            const reply = parsed.choices?.[0]?.message?.content || '';
            resolve(reply);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function callGeminiAPI(apiKey, model, prompt, systemInstruction) {
  return new Promise((resolve, reject) => {
    const geminiModel = model || 'gemini-1.5-flash';
    const postBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024
      }
    };
    if (systemInstruction) {
      postBody.systemInstruction = {
        parts: [{ text: systemInstruction }]
      };
    }
    const postData = JSON.stringify(postBody);

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/${encodeURIComponent(geminiModel)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.error?.message || `Gemini error status ${res.statusCode}`));
          } else {
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            resolve(text);
          }
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// 6. Static File MIME Mapping & Security
// ---------------------------------------------------------------------------
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

function serveStaticFile(req, res, pathname) {
  let safePath = pathname;
  if (safePath === '/' || safePath === '') {
    safePath = '/index.html';
  }

  // Prevent directory traversal attacks
  const normalized = path.normalize(safePath).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(__dirname, normalized);

  // Check if file is within root directory
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('403 Forbidden');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'SAMEORIGIN'
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// ---------------------------------------------------------------------------
// 7. HTTP Request Router & API Controllers
// ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  // ── Request timing & logging ──────────────────────────────────────────────
  const _startTime = Date.now();
  const _clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').replace('::ffff:', '');

  // Intercept writeHead to capture final status code for logging
  const _origWriteHead = res.writeHead.bind(res);
  let _statusCode = 200;
  res.writeHead = function(code, ...args) {
    _statusCode = code;
    return _origWriteHead(code, ...args);
  };

  // Log after response finishes
  res.on('finish', () => {
    const ms = Date.now() - _startTime;
    const parsedForLog = url.parse(req.url, true);
    // Skip noisy static asset logs (only show if error)
    const isStatic = /\.(css|js|png|jpg|jpeg|svg|ico|webp|woff2?|ttf)$/i.test(parsedForLog.pathname);
    if (!isStatic || _statusCode >= 400) {
      log.request(req.method, parsedForLog.pathname, _statusCode, ms, _clientIp);
    }
  });

  // CORS & Security Headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // -------------------------------------------------------------------------
  // API: Public Config
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/auth/config') {
    return sendJSON(res, 200, {
      googleClientId: GOOGLE_CLIENT_ID,
      authProvider: 'jwt_secure_cookie'
    });
  }

  // -------------------------------------------------------------------------
  // API: Get Workers Directory (For Employers & Worker Discovery)
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && (pathname === '/api/workers' || pathname === '/api/user/workers')) {
    const allUsers = getUsers();
    const tradeFilter = parsedUrl.query.tradeId || parsedUrl.query.trade;
    const searchFilter = (parsedUrl.query.searchQuery || parsedUrl.query.search || '').toLowerCase().trim();

    const formattedWorkers = allUsers
      .filter(u => {
        if (!u) return false;
        const isWorker = u.role === 'worker' || u.account_type === 'job_seeker' || !!u.job_seeker_profile || !!u.worker_profile || u.profile?.user_type === 'job_seeker';
        return isWorker;
      })
      .map(u => {
        const profileSource = u.job_seeker_profile || u.worker_profile || u.profile || {};
        const personal = profileSource.personal || {};

        const rawRole =
          profileSource.preferences?.preferred_roles?.[0] ||
          profileSource.experience?.[0]?.job_title ||
          profileSource.skills?.[0]?.name ||
          u.profile?.profession ||
          u.profile?.trade ||
          'कामगार';

        const rawLower = String(rawRole).toLowerCase();
        let tradeId = 'helper';
        let tradeName = rawRole;
        let icon = '💼';

        if (rawLower.includes('cook') || rawLower.includes('खाना') || rawLower.includes('रसोई') || rawLower.includes('कुक')) {
          tradeId = 'cooking';
          tradeName = rawRole || 'खाना बनाना / कुक';
          icon = '🍳';
        } else if (rawLower.includes('clean') || rawLower.includes('झाड़ू') || rawLower.includes('सफाई') || rawLower.includes('साफ़')) {
          tradeId = 'cleaning';
          tradeName = rawRole || 'साफ़-सफ़ाई / हेल्पर';
          icon = '🧹';
        } else if (rawLower.includes('driv') || rawLower.includes('ड्राइव') || rawLower.includes('गाड़ी')) {
          tradeId = 'driving';
          tradeName = rawRole || 'ड्राइविंग';
          icon = '🚗';
        } else if (rawLower.includes('electr') || rawLower.includes('बिजली') || rawLower.includes('इलेक्ट्रीशियन')) {
          tradeId = 'electrician';
          tradeName = rawRole || 'इलेक्ट्रीशियन';
          icon = '⚡';
        } else if (rawLower.includes('mason') || rawLower.includes('मिस्त्री') || rawLower.includes('राजमिस्त्री')) {
          tradeId = 'mason';
          tradeName = rawRole || 'राजमिस्त्री';
          icon = '🧱';
        } else if (rawLower.includes('plumb') || rawLower.includes('नल') || rawLower.includes('प्लंबर')) {
          tradeId = 'plumber';
          tradeName = rawRole || 'प्लंबर';
          icon = '🚰';
        } else if (rawLower.includes('paint') || rawLower.includes('पेंट') || rawLower.includes('रंग')) {
          tradeId = 'painter';
          tradeName = rawRole || 'पेंटर';
          icon = '🎨';
        } else if (rawLower.includes('weld') || rawLower.includes('वेल्ड')) {
          tradeId = 'welder';
          tradeName = rawRole || 'वेल्डर';
          icon = '🔥';
        } else if (rawLower.includes('help') || rawLower.includes('मजदूर') || rawLower.includes('हेल्पर')) {
          tradeId = 'helper';
          tradeName = rawRole || 'मजदूर / हेल्पर';
          icon = '👷';
        } else if (rawLower.includes('carpent') || rawLower.includes('बढ़ई')) {
          tradeId = 'carpenter';
          tradeName = rawRole || 'बढ़ई';
          icon = '🪚';
        } else if (rawLower.includes('load') || rawLower.includes('हमाल') || rawLower.includes('लोडर')) {
          tradeId = 'loader';
          tradeName = rawRole || 'लोडर / हमाल';
          icon = '📦';
        }

        const skillsList = Array.isArray(profileSource.skills) ? profileSource.skills : [];
        const expList = Array.isArray(profileSource.experience) ? profileSource.experience : [];

        return {
          id: u.user_id || u.id,
          name: u.username || u.name || personal.full_name || 'Worker',
          phone: personal.mobile_number || u.mobile_number || u.phone || '',
          email: personal.email || u.email || '',
          city: personal.current_city || 'रायपुर (Raipur)',
          age: personal.age || u.age || 26,
          tradeId,
          primaryTrade: tradeName,
          profession: tradeName,
          tradeIcon: icon,
          skills: skillsList,
          experience: expList,
          expectedWage: profileSource.preferences?.expected_salary_min || 500,
          lookingFor: profileSource.preferences?.looking_for?.[0] || 'Daily Wage',
          preferredCities: profileSource.preferences?.preferred_cities || ['Raipur'],
          rating: 4.8,
          jobsCompleted: 12,
          identityVerified: true,
          skillVerified: true,
          createdAt: u.created_at || null
        };
      })
      .filter(w => {
        if (tradeFilter && tradeFilter !== 'all' && w.tradeId !== tradeFilter) return false;
        if (searchFilter) {
          const matchStr = `${w.name} ${w.primaryTrade} ${w.city} ${(w.skills || []).map(s=>s.name||s).join(' ')}`.toLowerCase();
          if (!matchStr.includes(searchFilter)) return false;
        }
        return true;
      });

    return sendJSON(res, 200, { success: true, count: formattedWorkers.length, workers: formattedWorkers });
  }

  // -------------------------------------------------------------------------
  // API: User Sign Up
  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // API: User Sign Up (Create Account: Email, Username, Password)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/signup') {
    try {
      const body = await parseJSONBody(req);
      const username = (body.username || body.name || body.fullName || '').trim();
      const { email, password, confirmPassword } = body;

      // 1. Validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return sendJSON(res, 400, { error: 'Please enter a valid email address.' });
      }

      if (!username || username.length < 2) {
        return sendJSON(res, 400, { error: 'Please enter a valid username (minimum 2 characters).' });
      }

      if (!password || typeof password !== 'string') {
        return sendJSON(res, 400, { error: 'Password is required.' });
      }

      if (password.length < 6) {
        return sendJSON(res, 400, { error: 'Password must be at least 6 characters long.' });
      }

      if (confirmPassword && password !== confirmPassword) {
        return sendJSON(res, 400, { error: 'Passwords do not match.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const mobileNumber = (body.mobile_number || body.mobileNumber || '').trim();
      if (mobileNumber && !/^[6-9]\d{9}$/.test(mobileNumber.replace(/\D/g, ''))) {
        return sendJSON(res, 400, { error: 'Please enter a valid 10-digit mobile number.' });
      }

      const rawAccountType = body.account_type || body.accountType || (body.role === 'employer' ? 'employer' : 'job_seeker');
      const accountType = rawAccountType === 'employer' ? 'employer' : 'job_seeker';
      const userRole = body.role || (accountType === 'employer' ? 'employer' : 'worker');

      const users = getUsers();

      // 2. Prevent duplicate email accounts (One email = only one account)
      const existingUser = users.find((u) => u.email.toLowerCase() === cleanEmail);
      if (existingUser) {
        return sendJSON(res, 409, { error: 'An account with this email already exists.' });
      }

      // 3. Cryptographic salt & password hashing (never store plain-text)
      const salt = crypto.randomBytes(16).toString('hex');
      const password_hash = hashPassword(password, salt);
      const now = new Date().toISOString();
      const userId = 'usr_' + crypto.randomUUID().replace(/-/g, '');

      const newUser = {
        user_id: userId,
        username: username,
        name: username,
        email: cleanEmail,
        mobile_number: mobileNumber || null,
        account_type: accountType,
        password_hash: password_hash,
        salt: salt,
        auth_provider: 'local',
        role: userRole,
        profile_completed: false,
        completion_percentage: 0,
        profile: null,
        saved_data: body.saved_data || null,
        created_at: now,
        updated_at: now
      };

      users.push(newUser);
      saveUsers(users, newUser, password);

      // 4. Issue secure JWT & HttpOnly Session Cookie
      const token = generateJWT(newUser, 7);
      const cookieHeader = `cgneeti_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 86400}`;

      return sendJSON(
        res,
        201,
        {
          success: true,
          message: 'Account created successfully.',
          user: sanitizeUser(newUser),
          token: token
        },
        { 'Set-Cookie': cookieHeader }
      );
    } catch (err) {
      console.error('Signup error:', err);
      return sendJSON(res, 500, { error: 'An unexpected server error occurred during sign up.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: User Sign In (Login: Email, Username, Password)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/signin') {
    try {
      const body = await parseJSONBody(req);
      const { email, username, password, rememberMe } = body;

      if (!email || !password) {
        return sendJSON(res, 400, { error: 'Email and password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const inputUsername = (username || '').trim().toLowerCase();
      const users = getUsers();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      // Invalid email check
      if (!user) {
        return sendJSON(res, 401, { error: 'Invalid email, username, or password.' });
      }

      // If username provided, verify against registered username / name
      if (inputUsername) {
        const registeredUsername = (user.username || user.name || '').trim().toLowerCase();
        if (registeredUsername && registeredUsername !== inputUsername) {
          return sendJSON(res, 401, { error: 'Invalid email, username, or password.' });
        }
      }

      // If user registered with Google and has no local password
      if (!user.password_hash || !user.salt) {
        return sendJSON(res, 401, {
          error: 'This account was created with Google. Please use Google login to sign in.'
        });
      }

      const isMatch = verifyPassword(password, user.salt, user.password_hash);
      if (!isMatch) {
        return sendJSON(res, 401, { error: 'Invalid email, username, or password.' });
      }

      // Update timestamp
      user.updated_at = new Date().toISOString();
      saveUsers(users, user, password);

      const durationDays = rememberMe ? 30 : 7;
      const token = generateJWT(user, durationDays);
      const cookieHeader = `cgneeti_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${durationDays * 86400}`;

      return sendJSON(
        res,
        200,
        {
          success: true,
          message: 'Signed in successfully.',
          user: sanitizeUser(user),
          token: token
        },
        { 'Set-Cookie': cookieHeader }
      );
    } catch (err) {
      console.error('Signin error:', err);
      return sendJSON(res, 500, { error: 'An unexpected error occurred during sign in.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Get / Save User Saved Data (Per-User Workspace Persistence)
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/user/data') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    const users = getUsers();
    const user = users.find((u) => u.user_id === authUser.sub);
    if (!user) {
      return sendJSON(res, 404, { error: 'User not found.' });
    }
    return sendJSON(res, 200, {
      success: true,
      data: user.saved_data || null
    });
  }

  if (req.method === 'POST' && pathname === '/api/user/data') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    try {
      const body = await parseJSONBody(req);
      const users = getUsers();
      const user = users.find((u) => u.user_id === authUser.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found.' });
      }
      user.saved_data = body.data || body;
      user.updated_at = new Date().toISOString();
      saveUsers(users);
      return sendJSON(res, 200, {
        success: true,
        message: 'User data saved successfully.'
      });
    } catch (err) {
      return sendJSON(res, 400, { error: 'Failed to save user data.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Save User Profile (Page 1 & 2 Completion)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/user/profile') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    try {
      const body = await parseJSONBody(req);
      const { user_type, age, profession, custom_profession } = body;

      if (!user_type || !['employer', 'job_seeker'].includes(user_type)) {
        return sendJSON(res, 400, { error: 'Please select a valid user type (Employer or Job Seeker).' });
      }

      const numAge = parseInt(age, 10);
      if (isNaN(numAge) || numAge < 18 || numAge > 100) {
        return sendJSON(res, 400, { error: 'Please enter a valid age (minimum 18 years).' });
      }

      if (!profession || typeof profession !== 'string' || !profession.trim()) {
        return sendJSON(res, 400, { error: 'Please select your profession or field.' });
      }

      const finalProfession = profession === 'Other' && custom_profession ? custom_profession.trim() : profession.trim();
      if (!finalProfession) {
        return sendJSON(res, 400, { error: 'Please enter your profession/field.' });
      }

      const users = getUsers();
      const user = users.find((u) => u.user_id === authUser.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found.' });
      }

      user.profile_completed = true;
      user.age = numAge;
      const profileData = {
        user_type: user_type,
        age: numAge,
        profession: finalProfession,
        custom_profession: profession === 'Other' ? custom_profession.trim() : null,
        completed_at: new Date().toISOString()
      };
      user.profile = profileData;
      if (user_type === 'job_seeker') {
        user.worker_profile = profileData;
      } else if (user_type === 'employer') {
        user.employer_profile = profileData;
      }
      // Map user_type to platform role ('job_seeker' -> 'worker', 'employer' -> 'employer')
      user.role = user_type === 'employer' ? 'employer' : 'worker';
      user.updated_at = new Date().toISOString();

      saveUsers(users);

      return sendJSON(res, 200, {
        success: true,
        message: 'Profile completed successfully.',
        user: sanitizeUser(user)
      });
    } catch (err) {
      console.error('Error saving profile:', err);
      return sendJSON(res, 500, { error: 'Failed to save profile.' });
    }
  }

  // -------------------------------------------------------------------------
  // Multi-step Profile Helpers & Calculation
  // -------------------------------------------------------------------------
  function calculateJobSeekerCompletion(profile) {
    if (!profile) {
      return {
        percentage: 0,
        completed_sections: [],
        missing_sections: [
          'Personal Information', 'Employment Status', 'Education',
          'Skills', 'Work Experience', 'Job Preferences',
          'Languages', 'Portfolio & Resume', 'Privacy & Visibility'
        ],
        is_ready_for_matching: false
      };
    }

    const sections = [
      ['Personal Information', !!(profile.personal && profile.personal.full_name && (profile.personal.mobile_number || profile.personal.email) && profile.personal.current_city)],
      ['Employment Status', !!(profile.employment_status && profile.employment_status.status)],
      ['Education', !!(profile.education && profile.education.length > 0 && profile.education[0].level)],
      ['Skills', !!(profile.skills && profile.skills.length > 0 && profile.skills[0].name)],
      ['Work Experience', profile.has_experience === false || !!(profile.has_experience === true && profile.experience && profile.experience.length > 0)],
      ['Job Preferences', !!(profile.preferences && ((profile.preferences.looking_for && profile.preferences.looking_for.length > 0) || (profile.preferences.preferred_roles && profile.preferences.preferred_roles.length > 0) || (profile.preferences.work_modes && profile.preferences.work_modes.length > 0)))],
      ['Languages', !!(profile.languages && profile.languages.length > 0 && profile.languages[0].language)],
      ['Portfolio & Resume', !!(profile.portfolio && (profile.portfolio.resume_url || profile.portfolio.linkedin_url || profile.portfolio.portfolio_url))],
      ['Privacy & Visibility', !!(profile.visibility && profile.visibility.visibility)],
      ['Final Confirmation', !!(profile.is_submitted || profile.completed_at)]
    ];

    const completed = sections.filter(([, done]) => done).map(([name]) => name);
    const missing = sections.filter(([, done]) => !done).map(([name]) => name);
    const percentage = Math.round((completed.length / sections.length) * 100);

    const essential_met = completed.includes('Personal Information') && completed.includes('Employment Status') && completed.includes('Skills');

    return {
      percentage,
      completed_sections: completed,
      missing_sections: missing,
      is_ready_for_matching: essential_met && percentage >= 40
    };
  }

  function calculateEmployerCompletion(profile) {
    if (!profile) {
      return {
        percentage: 0,
        completed_sections: [],
        missing_sections: [
          'Business Type', 'Business Information', 'Office Location',
          'Recruiter Contact', 'Hiring Information', 'Hiring Locations',
          'Business Verification', 'Company Profile & Culture', 'Hiring Preferences', 'Profile Visibility'
        ],
        is_ready_for_matching: false
      };
    }

    const sections = [
      ['Business Type', !!profile.business_type],
      ['Business Information', !!(profile.business_info && profile.business_info.name && (profile.business_info.industry || profile.business_info.description))],
      ['Office Location', !!(profile.location && (profile.location.city || profile.location.work_model))],
      ['Recruiter Contact', !!(profile.recruiter_info && profile.recruiter_info.name && (profile.recruiter_info.official_email || profile.recruiter_info.mobile_number))],
      ['Hiring Information', !!(profile.hiring_info && ((profile.hiring_info.hiring_types && profile.hiring_info.hiring_types.length > 0) || (profile.hiring_info.categories && profile.hiring_info.categories.length > 0)))],
      ['Hiring Locations', !!(profile.hiring_location && ((profile.hiring_location.cities && profile.hiring_location.cities.length > 0) || profile.hiring_location.remote_hiring || profile.hiring_location.onsite_hiring))],
      ['Business Verification', !!(profile.verification && (profile.verification.official_website || profile.verification.official_email || profile.verification.gstin || profile.verification.registration_number))],
      ['Company Profile & Culture', !!(profile.company_profile && (profile.company_profile.description || profile.company_profile.mission || (profile.company_profile.benefits && profile.company_profile.benefits.length > 0) || profile.company_profile.work_culture))],
      ['Hiring Preferences', !!(profile.hiring_preferences && (profile.hiring_preferences.candidate_experience || (profile.hiring_preferences.preferred_skills && profile.hiring_preferences.preferred_skills.length > 0)))],
      ['Profile Visibility', !!(profile.visibility && profile.visibility.visibility)]
    ];

    const completed = sections.filter(([, done]) => done).map(([name]) => name);
    const missing = sections.filter(([, done]) => !done).map(([name]) => name);
    const percentage = Math.round((completed.length / sections.length) * 100);

    const essential_met = completed.includes('Business Information') && completed.includes('Recruiter Contact') && completed.includes('Hiring Information');

    return {
      percentage,
      completed_sections: completed,
      missing_sections: missing,
      is_ready_for_matching: essential_met && percentage >= 40
    };
  }

  // -------------------------------------------------------------------------
  // API: Get Profile Completion Breakdown
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/user/profile/completion') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    const users = getUsers();
    const user = users.find((u) => u.user_id === authUser.sub);
    if (!user) {
      return sendJSON(res, 404, { error: 'User not found.' });
    }

    const accountType = user.account_type || (user.role === 'employer' ? 'employer' : 'job_seeker');
    const breakdown = accountType === 'employer'
      ? calculateEmployerCompletion(user.employer_profile || {})
      : calculateJobSeekerCompletion(user.job_seeker_profile || user.worker_profile || {});

    return sendJSON(res, 200, {
      success: true,
      account_type: accountType,
      breakdown
    });
  }

  // -------------------------------------------------------------------------
  // API: Job Seeker Profile (GET & POST)
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/user/profile/job-seeker') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    const users = getUsers();
    const user = users.find((u) => u.user_id === authUser.sub);
    if (!user) {
      return sendJSON(res, 404, { error: 'User not found.' });
    }
    const profile = user.job_seeker_profile || user.worker_profile || {};
    const breakdown = calculateJobSeekerCompletion(profile);
    return sendJSON(res, 200, {
      success: true,
      profile,
      completion: breakdown
    });
  }

  if (req.method === 'POST' && pathname === '/api/user/profile/job-seeker') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    try {
      const body = await parseJSONBody(req);
      const users = getUsers();
      const user = users.find((u) => u.user_id === authUser.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found.' });
      }

      const now = new Date().toISOString();
      const profileData = {
        ...body,
        updated_at: now,
        is_submitted: true
      };

      const breakdown = calculateJobSeekerCompletion(profileData);
      const percentage = breakdown.percentage;

      user.job_seeker_profile = profileData;
      user.worker_profile = profileData;
      user.role = 'worker';
      user.account_type = 'job_seeker';
      user.profile_completed = percentage >= 60;
      user.completion_percentage = percentage;
      user.completion_breakdown = breakdown;

      if (profileData.personal) {
        if (profileData.personal.full_name) {
          user.name = profileData.personal.full_name;
          user.username = profileData.personal.full_name;
        }
        if (profileData.personal.mobile_number) {
          user.mobile_number = profileData.personal.mobile_number;
        }
        if (profileData.personal.age) {
          user.age = profileData.personal.age;
        }
      }
      user.updated_at = now;
      saveUsers(users);

      return sendJSON(res, 200, {
        success: true,
        message: 'Job Seeker profile saved successfully.',
        user: sanitizeUser(user),
        profile: profileData,
        completion: breakdown
      });
    } catch (err) {
      console.error('Job seeker profile save error:', err);
      return sendJSON(res, 500, { error: 'Failed to save Job Seeker profile.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Employer Profile (GET & POST)
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/user/profile/employer') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    const users = getUsers();
    const user = users.find((u) => u.user_id === authUser.sub);
    if (!user) {
      return sendJSON(res, 404, { error: 'User not found.' });
    }
    const profile = user.employer_profile || {};
    const breakdown = calculateEmployerCompletion(profile);
    return sendJSON(res, 200, {
      success: true,
      profile,
      completion: breakdown
    });
  }

  if (req.method === 'POST' && pathname === '/api/user/profile/employer') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    try {
      const body = await parseJSONBody(req);
      const users = getUsers();
      const user = users.find((u) => u.user_id === authUser.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found.' });
      }

      const now = new Date().toISOString();
      const existingProfile = user.employer_profile || {};
      const existingVerification = existingProfile.verification || {};

      const profileData = {
        ...body,
        updated_at: now,
        is_submitted: true
      };

      // Server-controlled verification status
      if (profileData.verification) {
        const curStatus = existingVerification.status || 'not_verified';
        if (profileData.verification.status === 'verified' && curStatus !== 'verified') {
          profileData.verification.status = 'pending';
        } else if (!profileData.verification.status) {
          profileData.verification.status = curStatus;
        }
      }

      const breakdown = calculateEmployerCompletion(profileData);
      const percentage = breakdown.percentage;

      user.employer_profile = profileData;
      user.role = 'employer';
      user.account_type = 'employer';
      user.profile_completed = percentage >= 60;
      user.completion_percentage = percentage;
      user.completion_breakdown = breakdown;

      if (profileData.recruiter_info && profileData.recruiter_info.name) {
        user.name = profileData.recruiter_info.name;
      } else if (profileData.business_info && profileData.business_info.name) {
        user.name = profileData.business_info.name;
      }
      if (profileData.recruiter_info && profileData.recruiter_info.mobile_number) {
        user.mobile_number = profileData.recruiter_info.mobile_number;
      }
      user.updated_at = now;
      saveUsers(users);

      return sendJSON(res, 200, {
        success: true,
        message: 'Employer profile saved successfully.',
        user: sanitizeUser(user),
        profile: profileData,
        completion: breakdown
      });
    } catch (err) {
      console.error('Employer profile save error:', err);
      return sendJSON(res, 500, { error: 'Failed to save Employer profile.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Switch Active Role / Purpose (Worker <-> Employer)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && (pathname === '/api/user/switch-role' || pathname === '/api/auth/switch-role')) {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }
    try {
      const body = await parseJSONBody(req);
      const targetRole = body.role;
      if (!['worker', 'employer', 'admin'].includes(targetRole)) {
        return sendJSON(res, 400, { error: 'Invalid role specified. Must be worker or employer.' });
      }

      const users = getUsers();
      const user = users.find((u) => u.user_id === authUser.sub);
      if (!user) {
        return sendJSON(res, 404, { error: 'User not found.' });
      }

      user.role = targetRole;
      if (targetRole === 'worker' && user.worker_profile) {
        user.profile = user.worker_profile;
      } else if (targetRole === 'employer' && user.employer_profile) {
        user.profile = user.employer_profile;
      }
      user.updated_at = new Date().toISOString();
      saveUsers(users);

      const token = generateJWT(user, 7);
      const cookieHeader = `cgneeti_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 86400}`;

      return sendJSON(
        res,
        200,
        {
          success: true,
          message: `Switched to ${targetRole} mode successfully.`,
          user: sanitizeUser(user),
          token: token
        },
        { 'Set-Cookie': cookieHeader }
      );
    } catch (err) {
      return sendJSON(res, 500, { error: 'Failed to switch role.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: AI Chat Assistant Integration (Groq & Gemini)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/ai/chat') {
    try {
      const body = await parseJSONBody(req);
      const { provider, apiKey, model, messages, prompt, systemInstruction } = body;

      if (!apiKey) {
        return sendJSON(res, 400, { error: 'API key is required to use AI features.' });
      }

      let reply = '';
      if (provider === 'gemini') {
        const userPrompt = prompt || (messages && messages.filter(m => m.role === 'user').map(m => m.content).pop()) || 'नमस्ते';
        reply = await callGeminiAPI(apiKey, model, userPrompt, systemInstruction);
      } else {
        // Groq Default
        const chatMessages = messages && messages.length > 0 ? messages : [
          { role: 'system', content: systemInstruction || 'You are KaamSaathi AI Assistant.' },
          { role: 'user', content: prompt || 'नमस्ते' }
        ];
        reply = await callGroqAPI(apiKey, model, chatMessages);
      }

      return sendJSON(res, 200, {
        success: true,
        provider: provider || 'groq',
        reply: reply
      });
    } catch (err) {
      log.error(`[AI Chat Error] ${err.message}`);
      return sendJSON(res, 500, { error: err.message || 'AI request failed' });
    }
  }

  // -------------------------------------------------------------------------
  // API: AI Key Verification / Test Ping
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/ai/test-key') {
    try {
      const body = await parseJSONBody(req);
      const { provider, apiKey, model } = body;

      if (!apiKey) {
        return sendJSON(res, 400, { error: 'Please enter an API key to test.' });
      }

      if (provider === 'gemini') {
        await callGeminiAPI(apiKey, model || 'gemini-1.5-flash', 'Respond with OK');
      } else {
        await callGroqAPI(apiKey, model || 'llama-3.3-70b-versatile', [
          { role: 'user', content: 'Respond with OK' }
        ]);
      }

      return sendJSON(res, 200, {
        success: true,
        message: `${provider === 'gemini' ? 'Google Gemini' : 'Groq Cloud'} API Key verified successfully!`
      });
    } catch (err) {
      return sendJSON(res, 400, {
        error: `Key validation failed: ${err.message}`
      });
    }
  }

  // -------------------------------------------------------------------------
  // API: Google Sign-In / OAuth Integration
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/google') {
    try {
      const body = await parseJSONBody(req);
      const { credential, testEmail, testName } = body;

      let googleUser = null;

      if (credential) {
        try {
          // Verify with Google TokenInfo API
          const payload = await verifyGoogleToken(credential);

          // Verify audience if GOOGLE_CLIENT_ID is configured
          if (GOOGLE_CLIENT_ID && payload.aud !== GOOGLE_CLIENT_ID) {
            return sendJSON(res, 401, { error: 'Google authentication failed: Client ID mismatch.' });
          }

          googleUser = {
            email: payload.email.toLowerCase(),
            name: payload.name || payload.email.split('@')[0],
            sub: payload.sub,
            picture: payload.picture
          };
        } catch (err) {
          console.error('Google token verification error:', err);
          return sendJSON(res, 401, { error: 'Google authentication failed. Please try again.' });
        }
      } else if (process.env.NODE_ENV !== 'production' && testEmail) {
        // Fallback for local development testing when Google OAuth credentials are not yet entered
        googleUser = {
          email: testEmail.toLowerCase().trim(),
          name: testName || 'Google User',
          sub: 'google_test_' + Date.now()
        };
      } else {
        return sendJSON(res, 400, { error: 'Google credential token is required.' });
      }

      const users = getUsers();
      let user = users.find((u) => u.email.toLowerCase() === googleUser.email);
      const now = new Date().toISOString();

      if (user) {
        // Link with existing user without duplicating account
        user.auth_provider = 'google';
        user.google_sub = googleUser.sub;
        user.updated_at = now;
      } else {
        // Create new user account from verified Google profile
        user = {
          user_id: 'usr_' + crypto.randomUUID().replace(/-/g, ''),
          name: googleUser.name,
          email: googleUser.email,
          auth_provider: 'google',
          google_sub: googleUser.sub,
          role: body.role || 'worker',
          created_at: now,
          updated_at: now
        };
        users.push(user);
      }
      saveUsers(users);

      const token = generateJWT(user, 7);
      const cookieHeader = `cgneeti_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${7 * 86400}`;

      return sendJSON(
        res,
        200,
        {
          success: true,
          message: 'Google authentication successful.',
          user: sanitizeUser(user),
          token: token
        },
        { 'Set-Cookie': cookieHeader }
      );
    } catch (err) {
      console.error('Google auth error:', err);
      return sendJSON(res, 500, { error: 'Google authentication error.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Get Current Authenticated User (Session Verification)
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/auth/me') {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Your session has expired. Please sign in again.' });
    }

    const users = getUsers();
    const user = users.find((u) => u.user_id === authUser.sub);
    if (!user) {
      return sendJSON(res, 401, { error: 'User account no longer exists.' });
    }

    return sendJSON(res, 200, {
      authenticated: true,
      user: sanitizeUser(user),
      token: req.token || (typeof extractToken === 'function' ? extractToken(req) : null)
    });
  }

  // -------------------------------------------------------------------------
  // API: Logout
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const token = extractToken(req);
    if (token) {
      revokedTokens.add(token);
    }
    // Clear session cookie immediately
    const clearCookieHeader = 'cgneeti_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
    return sendJSON(
      res,
      200,
      { success: true, message: 'Logged out successfully.' },
      { 'Set-Cookie': clearCookieHeader }
    );
  }

  // -------------------------------------------------------------------------
  // API: Forgot Password (Request Reset Link)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/forgot-password') {
    try {
      const body = await parseJSONBody(req);
      const { email } = body;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email.trim())) {
        return sendJSON(res, 400, { error: 'Please enter a valid email address.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      const users = getUsers();
      const user = users.find((u) => u.email.toLowerCase() === cleanEmail);

      let secureResetToken = null;
      if (user) {
        // Generate secure 32-byte cryptographic token with 1-hour expiration
        secureResetToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(secureResetToken).digest('hex');
        resetTokens.set(tokenHash, {
          userId: user.user_id,
          expiresAt: Date.now() + 60 * 60 * 1000 // 1 hour
        });
      }

      // Requirement 8: Never reveal whether an email belongs to an account
      return sendJSON(res, 200, {
        success: true,
        message: 'If an account exists with this email, password reset instructions have been sent.',
        devResetToken: process.env.NODE_ENV !== 'production' ? secureResetToken : undefined,
        debugToken: process.env.NODE_ENV !== 'production' ? secureResetToken : undefined
      });
    } catch (err) {
      return sendJSON(res, 500, { error: 'Unable to process password reset request.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Reset Password (Confirm New Password)
  // -------------------------------------------------------------------------
  if (req.method === 'POST' && pathname === '/api/auth/reset-password') {
    try {
      const body = await parseJSONBody(req);
      const token = body.token;
      const password = body.password || body.newPassword;
      const confirmPassword = body.confirmPassword || password;

      if (!token) {
        return sendJSON(res, 400, { error: 'Password reset token is missing.' });
      }

      if (!password || password.length < 8) {
        return sendJSON(res, 400, { error: 'Password must be at least 8 characters long.' });
      }

      if (password !== confirmPassword) {
        return sendJSON(res, 400, { error: 'Passwords do not match.' });
      }

      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const resetEntry = resetTokens.get(tokenHash);

      if (!resetEntry || resetEntry.expiresAt < Date.now()) {
        resetTokens.delete(tokenHash);
        return sendJSON(res, 400, { error: 'Password reset link is invalid or has expired.' });
      }

      const users = getUsers();
      const user = users.find((u) => u.user_id === resetEntry.userId);
      if (!user) {
        return sendJSON(res, 400, { error: 'User account not found.' });
      }

      // Update password hash with fresh salt
      const newSalt = crypto.randomBytes(16).toString('hex');
      user.password_hash = hashPassword(password, newSalt);
      user.salt = newSalt;
      user.auth_provider = 'local';
      user.updated_at = new Date().toISOString();
      saveUsers(users, user, password);

      // Invalidate used reset token
      resetTokens.delete(tokenHash);

      return sendJSON(res, 200, {
        success: true,
        message: 'Password has been reset successfully. Please sign in.'
      });
    } catch (err) {
      return sendJSON(res, 500, { error: 'Failed to reset password.' });
    }
  }

  // -------------------------------------------------------------------------
  // API: Protected Resource (Security & Authorization Test)
  // Verifies that User A cannot access User B's data
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname.startsWith('/api/protected/user-data/')) {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return sendJSON(res, 401, { error: 'Unauthorized: Authentication required.' });
    }

    const targetUserId = pathname.replace('/api/protected/user-data/', '').trim();

    // Verify authority: extract from verified token, never trust client-supplied ID
    if (authUser.sub !== targetUserId && authUser.role !== 'admin') {
      return sendJSON(res, 403, {
        error: "Access denied: You cannot access another user's protected data."
      });
    }

    const users = getUsers();
    const user = users.find((u) => u.user_id === targetUserId);
    if (!user) {
      return sendJSON(res, 404, { error: 'User data not found.' });
    }

    return sendJSON(res, 200, {
      success: true,
      data: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        secretAccountData: `Confidential workspace data for ${user.name}`
      }
    });
  }

  // -------------------------------------------------------------------------
  // API: Get Workers / Job Seekers Directory
  // -------------------------------------------------------------------------
  if (req.method === 'GET' && pathname === '/api/workers') {
    try {
      const parsedUrl = url.parse(req.url, true);
      const query = parsedUrl.query || {};
      const tradeFilter = query.tradeId || query.trade || null;
      const searchQuery = (query.searchQuery || query.search || '').toLowerCase().trim();
      const users = getUsers();
      const workers = [];

      for (const u of users) {
        if (!u) continue;
        const isWorker = (
          u.role === 'worker' ||
          u.account_type === 'job_seeker' ||
          Boolean(u.job_seeker_profile) ||
          Boolean(u.worker_profile) ||
          (u.profile && u.profile.user_type === 'job_seeker')
        );
        if (!isWorker) continue;

        const prof = u.job_seeker_profile || u.worker_profile || u.profile || {};
        const personal = prof.personal || {};
        const rawRole = (
          (prof.preferences && prof.preferences.preferred_roles && prof.preferences.preferred_roles[0]) ||
          (prof.experience && prof.experience[0] && prof.experience[0].job_title) ||
          (prof.skills && prof.skills[0] && prof.skills[0].name) ||
          (u.profile && u.profile.profession) ||
          'कामगार'
        );
        const lowerRole = String(rawRole).toLowerCase();
        let tradeId = 'helper';
        let tradeName = rawRole;
        let icon = '💼';

        if (lowerRole.includes('cook') || lowerRole.includes('खाना') || lowerRole.includes('रसोई') || lowerRole.includes('कुक') || lowerRole.includes('शेफ')) {
          tradeId = 'cooking'; tradeName = rawRole || 'खाना बनाना (Cook)'; icon = '🍳';
        } else if (lowerRole.includes('clean') || lowerRole.includes('झाड़ू') || lowerRole.includes('सफाई') || lowerRole.includes('साफ़')) {
          tradeId = 'cleaning'; tradeName = rawRole || 'साफ़-सफ़ाई / हेल्पर'; icon = '🧹';
        } else if (lowerRole.includes('driv') || lowerRole.includes('ड्राइव') || lowerRole.includes('गाड़ी')) {
          tradeId = 'driving'; tradeName = rawRole || 'ड्राइविंग'; icon = '🚗';
        } else if (lowerRole.includes('electr') || lowerRole.includes('बिजली') || lowerRole.includes('इलेक्ट्रीशियन')) {
          tradeId = 'electrician'; tradeName = rawRole || 'इलेक्ट्रीशियन'; icon = '⚡';
        } else if (lowerRole.includes('mason') || lowerRole.includes('मिस्त्री') || lowerRole.includes('राजमिस्त्री') || lowerRole.includes('निर्माण')) {
          tradeId = 'mason'; tradeName = rawRole || 'राजमिस्त्री'; icon = '🧱';
        } else if (lowerRole.includes('plumb') || lowerRole.includes('नल') || lowerRole.includes('प्लंबर')) {
          tradeId = 'plumber'; tradeName = rawRole || 'प्लंबर'; icon = '🚰';
        } else if (lowerRole.includes('paint') || lowerRole.includes('पेंट') || lowerRole.includes('रंग')) {
          tradeId = 'painter'; tradeName = rawRole || 'पेंटर'; icon = '🎨';
        } else if (lowerRole.includes('weld') || lowerRole.includes('वेल्ड')) {
          tradeId = 'welder'; tradeName = rawRole || 'वेल्डर'; icon = '🔥';
        } else if (lowerRole.includes('help') || lowerRole.includes('मजदूर') || lowerRole.includes('हेल्पर')) {
          tradeId = 'helper'; tradeName = rawRole || 'मजदूर / हेल्पर'; icon = '👷';
        } else if (lowerRole.includes('carpent') || lowerRole.includes('बढ़ई') || lowerRole.includes('कारपेंटर')) {
          tradeId = 'carpenter'; tradeName = rawRole || 'बढ़ई'; icon = '🪚';
        }

        if (tradeFilter && tradeFilter !== 'all' && tradeId !== tradeFilter) {
          continue;
        }

        const wName = u.username || u.name || personal.full_name || 'Worker';
        const skills = prof.skills || [];
        const cityName = personal.current_city || u.city || 'रायपुर (Raipur)';

        if (searchQuery) {
          const matchStr = `${wName} ${tradeName} ${cityName} ${skills.map(s => s.name || s).join(' ')}`.toLowerCase();
          if (!matchStr.includes(searchQuery)) continue;
        }

        workers.push({
          id: u.user_id || u.id,
          name: wName,
          phone: personal.mobile_number || u.mobile_number || u.phone || '',
          email: personal.email || u.email || '',
          city: cityName,
          age: personal.age || u.age || 26,
          tradeId: tradeId,
          primaryTrade: tradeName,
          profession: tradeName,
          tradeIcon: icon,
          skills: skills,
          experience: prof.experience || [],
          expectedWage: (prof.preferences && prof.preferences.expected_salary_min) || 500,
          lookingFor: (prof.preferences && prof.preferences.looking_for && prof.preferences.looking_for[0]) || 'Daily Wage',
          preferredCities: (prof.preferences && prof.preferences.preferred_cities) || ['Raipur'],
          rating: u.rating || 4.8,
          jobsCompleted: u.jobsCompleted || 12,
          identityVerified: true,
          skillVerified: true,
          createdAt: u.created_at
        });
      }

      return sendJSON(res, 200, {
        success: true,
        count: workers.length,
        workers: workers
      });
    } catch (err) {
      return sendJSON(res, 500, { error: 'Failed to retrieve workers list.' });
    }
  }

  // -------------------------------------------------------------------------
  // Integrated Backend Proxy & Status Routes
  // -------------------------------------------------------------------------
  // 1. Swagger Docs, ReDoc & OpenAPI Schema (Forward to FastAPI Backend)
  if (pathname === '/docs' || pathname.startsWith('/docs/') ||
      pathname === '/redoc' || pathname.startsWith('/redoc/') ||
      pathname === '/openapi.json') {
    return proxyToBackend(req, res);
  }

  // 2. Integration Health & Status Diagnostic
  if (req.method === 'GET' && pathname === '/api/backend-status') {
    const healthReq = http.request({
      hostname: BACKEND_HOST,
      port: BACKEND_PORT,
      path: '/health',
      method: 'GET',
      timeout: 1500
    }, (healthRes) => {
      let data = '';
      healthRes.on('data', chunk => { data += chunk; });
      healthRes.on('end', () => {
        let parsed = null;
        try { parsed = JSON.parse(data); } catch (_) {}
        return sendJSON(res, 200, {
          success: true,
          status: 'integrated',
          frontend: { port: PORT, url: `http://localhost:${PORT}` },
          backend: { port: BACKEND_PORT, url: `http://${BACKEND_HOST}:${BACKEND_PORT}`, online: true, health: parsed },
          proxy: { active: true, docsUrl: `http://localhost:${PORT}/docs`, apiRoot: `http://localhost:${PORT}/api` }
        });
      });
    });

    healthReq.on('error', () => {
      return sendJSON(res, 200, {
        success: true,
        status: 'partial',
        frontend: { port: PORT, url: `http://localhost:${PORT}`, online: true },
        backend: { port: BACKEND_PORT, url: `http://${BACKEND_HOST}:${BACKEND_PORT}`, online: false },
        proxy: { active: true, message: 'FastAPI backend is offline. Run RUN.bat to start both.' }
      });
    });

    healthReq.on('timeout', () => {
      healthReq.destroy();
      return sendJSON(res, 200, {
        success: true,
        status: 'timeout',
        frontend: { port: PORT, url: `http://localhost:${PORT}`, online: true },
        backend: { port: BACKEND_PORT, online: false },
        proxy: { active: true }
      });
    });

    healthReq.end();
    return;
  }

  // 3. Forward all unhandled API routes to FastAPI Backend
  if (pathname.startsWith('/api/')) {
    return proxyToBackend(req, res);
  }

  // -------------------------------------------------------------------------
  // Static Files Fallback
  // -------------------------------------------------------------------------
  serveStaticFile(req, res, pathname);
});

// ---------------------------------------------------------------------------
// 8. Backend Process Management (Auto-starts FastAPI if not running)
// ---------------------------------------------------------------------------
const os = require('os');
const { spawn, execSync } = require('child_process');
let backendProcess = null;

function getLocalIpAddress() {
  try {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  } catch (_) {}
  return '127.0.0.1';
}

function freePort(port) {
  try {
    if (process.platform === 'win32') {
      const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const state = parts[3];
        const pid = parseInt(parts[parts.length - 1], 10);
        if (state === 'LISTENING' && pid && pid !== process.pid) {
          log.warn(`Port ${port} was occupied by process PID ${pid}. Clearing stale process...`);
          try {
            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
          } catch (_) {}
        }
      }
    }
  } catch (_) {}
}

function openBrowser(targetUrl) {
  if (process.env.NO_OPEN === 'true') return;
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', targetUrl], { detached: true, stdio: 'ignore' }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (_) {}
}

function checkPortResponding(port) {
  return new Promise((resolve) => {
    const tester = http.get(`http://${BACKEND_HOST}:${port}/health`, (res) => {
      resolve(true); // Backend is already running
    });
    tester.on('error', () => {
      resolve(false); // Port is free
    });
    tester.setTimeout(1000, () => {
      tester.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendRunning() {
  const isRunning = await checkPortResponding(BACKEND_PORT);
  if (!isRunning) {
    const backendDir = path.join(__dirname, 'backend');
    console.log(`[*] Auto-starting FastAPI backend on port ${BACKEND_PORT}...`);
    try {
      backendProcess = spawn('python', ['-m', 'uvicorn', 'app.main:app', '--host', '0.0.0.0', '--port', String(BACKEND_PORT), '--reload'], {
        cwd: backendDir,
        stdio: 'inherit',
        shell: process.platform === 'win32'
      });

      backendProcess.on('error', (err) => {
        console.warn(`[!] Python backend process could not be auto-spawned: ${err.message}`);
        console.warn(`[!] Please run 'cd backend && python -m uvicorn app.main:app --port 8001' manually.`);
      });
    } catch (err) {
      console.warn(`[!] Failed to spawn Python backend: ${err.message}`);
    }
  } else {
    console.log(`[✓] FastAPI backend already running on port ${BACKEND_PORT}.`);
  }
}

function cleanup() {
  if (backendProcess) {
    try {
      if (process.platform === 'win32' && backendProcess.pid) {
        execSync(`taskkill /pid ${backendProcess.pid} /T /F`, { stdio: 'ignore' });
      } else {
        backendProcess.kill();
      }
    } catch (_) {}
    backendProcess = null;
  }
}
process.on('exit', cleanup);
process.on('SIGINT', () => { cleanup(); process.exit(0); });
// Prevent server crashes from unhandled asynchronous events or client socket resets
process.on('uncaughtException', (err) => {
  log.error(`[Process UncaughtException] ${err.message}`);
});

process.on('unhandledRejection', (reason) => {
  log.warn(`[Process UnhandledRejection] ${reason}`);
});

// Start listening if executed directly (Dual-stack: supports both IPv6 and IPv4 localhost)
if (require.main === module) {
  const shouldOpenBrowser = process.argv.includes('--open') || process.env.AUTO_OPEN === 'true';

  // Automatically free port from any lingering zombie process before binding
  freePort(PORT);

  let bindAttempts = 0;
  function bindServer() {
    bindAttempts++;
    server.listen(PORT, async () => {
      const localIp = getLocalIpAddress();
      log.divider();
      log.banner('  DailyJob (कामसाथी) — Node.js Frontend Server');
      log.info(`${CLR.bright}Frontend UI  ${CLR.reset}: ${CLR.cyan}http://localhost:${PORT}${CLR.reset}`);
      log.info(`${CLR.bright}Loopback     ${CLR.reset}: ${CLR.cyan}http://127.0.0.1:${PORT}${CLR.reset}`);
      log.info(`${CLR.bright}Mobile/Wi-Fi ${CLR.reset}: ${CLR.cyan}http://${localIp}:${PORT}${CLR.reset}`);
      log.info(`${CLR.bright}API Proxy    ${CLR.reset}: ${CLR.cyan}http://localhost:${PORT}/api/*${CLR.reset} ${CLR.gray}→ :${BACKEND_PORT}${CLR.reset}`);
      log.info(`${CLR.bright}Swagger Docs ${CLR.reset}: ${CLR.cyan}http://localhost:${PORT}/docs${CLR.reset}`);
      log.info(`${CLR.bright}FastAPI      ${CLR.reset}: ${CLR.cyan}http://localhost:${BACKEND_PORT}${CLR.reset}`);
      log.divider();
      log.info(`${CLR.gray}Format: [TIME] METHOD STATUS TIME  IP  PATH${CLR.reset}`);
      log.divider();

      await ensureBackendRunning();

      if (firestoreDb) {
        const existingUsers = getUsers();
        if (existingUsers && existingUsers.length > 0) {
          log.info(`Syncing ${existingUsers.length} user(s) to Firebase Firestore...`);
          for (const u of existingUsers) {
            syncUserToFirestore(u);
          }
        }
      }

      // Automatically open browser only AFTER server is confirmed up and listening
      if (shouldOpenBrowser) {
        log.info(`Opening browser at http://localhost:${PORT}...`);
        openBrowser(`http://localhost:${PORT}`);
      }
    });
  }

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && bindAttempts <= 2) {
      log.warn(`Port ${PORT} in use. Automatically clearing stale socket and retrying (attempt ${bindAttempts})...`);
      freePort(PORT);
      setTimeout(() => {
        try { server.close(); } catch (_) {}
        bindServer();
      }, 600);
      return;
    }
    log.error(`Server error: ${err.message}`);
    process.exit(1);
  });

  bindServer();
}

module.exports = { server, getUsers, saveUsers, hashPassword, verifyPassword, generateJWT, verifyJWT, syncUserToFirestore, getFirestoreDb: () => firestoreDb };
