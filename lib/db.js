import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI?.trim();

/** Host part after user:pass@ — for dev logs only (no password). */
function mongoUriHost(uri) {
  if (!uri) return '(empty — check .env.local in project root)';
  const at = uri.indexOf('@');
  if (at === -1) return '(invalid — password may need URL-encoding if it has @ # etc.)';
  const rest = uri.slice(at + 1);
  let end = rest.length;
  const slash = rest.indexOf('/');
  const q = rest.indexOf('?');
  if (slash >= 0) end = Math.min(end, slash);
  if (q >= 0) end = Math.min(end, q);
  return rest.slice(0, end);
}

const isNextBuildPhase =
  process.env.NEXT_PHASE === 'phase-production-build' ||
  process.env.NEXT_PHASE === 'phase-development-build';

if (!MONGODB_URI && process.env.NODE_ENV === 'production' && !isNextBuildPhase) {
  console.warn('[MongoDB] MONGODB_URI is not set');
}

/** @type {{ conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }} */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

function logConnectedOnce(m) {
  const g = global;
  if (g.__mongodbConnectLogged) return;
  g.__mongodbConnectLogged = true;
  const c = m.connection;
  const dbName = c.name || '(unknown)';
  const host = c.host || '(unknown)';
  console.log(`[MongoDB] Connected — host: ${host}, database: "${dbName}"`);
}

/** Console hints for common Atlas / network failures. */
function logMongoTroubleshooting(err) {
  const msg = String(err?.message || err);

  if (msg.includes('querySrv') || msg.includes('ECONNREFUSED')) {
    console.error(
      '[MongoDB] Hint (SRV): `mongodb+srv://` needs DNS SRV. If querySrv ECONNREFUSED:\n' +
        '  • Atlas → Network Access: allow your IP.\n' +
        '  • DNS 8.8.8.8 + ipconfig /flushdns, or use Atlas “Standard connection string” (mongodb://…:27017).'
    );
  }

  if (
    msg.includes('timed out') ||
    msg.includes('Timeout') ||
    msg.includes('ServerSelectionError') ||
    msg.includes('MongoNetworkTimeoutError')
  ) {
    console.error(
      '[MongoDB] Hint (timeout): Host resolves but TCP to port 27017 never completes. Usually:\n' +
        '  • Atlas → Network Access → Add Current IP (or 0.0.0.0/0 for dev only). Wait ~1 min.\n' +
        '  • PC/router/firewall/antivirus blocking outbound port 27017 — try mobile hotspot to test.\n' +
        '  • PowerShell: Test-NetConnection <host from your URI> -Port 27017  → TcpTestSucceeded should be True.\n' +
        '  • Use the exact connection string from Atlas (includes tls=true, replicaSet, authSource=admin).'
    );
  }
}

export async function connectDB() {
  if (!MONGODB_URI) {
    const err = new Error(
      'MONGODB_URI is not set — add it to .env.local (see .env.example)'
    );
    console.error('[MongoDB] Not connected:', err.message);
    throw err;
  }
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    if (process.env.NODE_ENV === 'development' && !global.__mongoDevHostLogged) {
      global.__mongoDevHostLogged = true;
      console.log('[MongoDB] Resolved cluster host:', mongoUriHost(MONGODB_URI));
    }
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 25_000,
    };
    cached.promise = mongoose
      .connect(MONGODB_URI, opts)
      .then((m) => {
        logConnectedOnce(m);
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('[MongoDB] Connection failed:', err.message);
        logMongoTroubleshooting(err);
        throw err;
      });
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    throw e;
  }
  return cached.conn;
}
