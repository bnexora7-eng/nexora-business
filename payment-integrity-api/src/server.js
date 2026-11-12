import { createServer } from "node:http";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { screenEvent, verifySignature } from "./screening.js";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./auth.js";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL;
const PROVIDER_SECRETS = JSON.parse(process.env.PROVIDER_SECRETS || "{}");
const ENABLE_PUBLIC_DEMO = process.env.ENABLE_PUBLIC_DEMO === "true";
const REVIEW_THRESHOLD = Number(process.env.REVIEW_THRESHOLD || 10000);
const MAX_BODY_BYTES = 65536;
const DEMO_ORIGIN = process.env.DEMO_ORIGIN || "https://bnexora7-eng.github.io";
const demoRequests = new Map();
const demoEvents = new Map();
const authAttempts = new Map();
let pool = null;

// The public demo is deliberately self-contained and can run without PostgreSQL.
// Authenticated provider webhooks still require DATABASE_URL and persistent storage.
if (DATABASE_URL) {
  // DATABASE_URL is wired by Render fromDatabase to the same-region internal URL.
  // Render's internal Postgres endpoint uses private networking; do not force TLS
  // against its self-signed internal certificate. External DB URLs must use TLS.
  pool = new Pool({ connectionString: DATABASE_URL, ssl: false });
  await pool.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
  console.log("NEXORA database schema is ready");
} else {
  console.log("NEXORA running in demo-only mode; DATABASE_URL is not configured");
}
if (!Object.keys(PROVIDER_SECRETS).length && !ENABLE_PUBLIC_DEMO) {
  throw new Error("Set PROVIDER_SECRETS or enable the public demo");
}

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}
function cors(req, res) {
  const origin = req.headers.origin;
  if (origin === DEMO_ORIGIN) {
    res.setHeader("access-control-allow-origin", DEMO_ORIGIN);
    res.setHeader("vary", "Origin");
    res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
    res.setHeader("access-control-allow-headers", "content-type, authorization, x-nexora-timestamp, x-nexora-signature");
    res.setHeader("access-control-max-age", "600");
  }
}
async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw Object.assign(new Error("Payload too large"), { statusCode: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function persistEvent(event) {
  if (!pool) return { unavailable: true };
  const result = screenEvent(event, { reviewThreshold: REVIEW_THRESHOLD });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO screened_events (provider_id,event_id,amount,currency,event_status,decision,reason,payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
       ON CONFLICT (provider_id,event_id) DO NOTHING RETURNING id`,
      [event.provider_id, event.event_id, event.amount, event.currency, event.status, result.decision, result.reason, JSON.stringify(event)]
    );
    const duplicate = inserted.rowCount === 0;
    const decision = duplicate ? "REJECT" : result.decision;
    const reason = duplicate ? "Duplicate provider + event identifier" : result.reason;
    await client.query(
      `INSERT INTO screening_audit (provider_id,event_id,decision,reason,is_duplicate,request_payload)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [event.provider_id, event.event_id, decision, reason, duplicate, JSON.stringify(event)]
    );
    await client.query("COMMIT");
    return { decision, reason, duplicate, reference: { provider_id: event.provider_id, event_id: event.event_id } };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}
async function handleEvent(req, res) {
  if (!pool) return send(res, 503, { error: "Provider webhook endpoint requires DATABASE_URL; public demo remains available" });
  const rawBody = await readBody(req);
  let event;
  try { event = JSON.parse(rawBody.toString("utf8")); }
  catch { return send(res, 400, { error: "Invalid JSON" }); }
  if (!event || typeof event !== "object" || Array.isArray(event)) return send(res, 422, { error: "Event must be a JSON object" });
  const providerId = typeof event.provider_id === "string" ? event.provider_id.trim() : "";
  const eventId = typeof event.event_id === "string" ? event.event_id.trim() : "";
  const amount = Number(event.amount);
  const currency = typeof event.currency === "string" ? event.currency.trim().toUpperCase() : "";
  const status = typeof event.status === "string" ? event.status.trim().toUpperCase() : "";
  const secret = PROVIDER_SECRETS[providerId];
  if (!secret) return send(res, 401, { error: "Unknown provider" });
  if (!verifySignature({ rawBody, timestamp: req.headers["x-nexora-timestamp"], signature: req.headers["x-nexora-signature"], secret })) {
    return send(res, 401, { error: "Invalid or expired webhook signature" });
  }
  if (!eventId || eventId.length > 256 || providerId.length > 128 ||
      !Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency) || !status || status.length > 32) {
    return send(res, 422, { error: "provider_id (max 128 chars), event_id (max 256 chars), positive amount, ISO currency code and status (max 32 chars) are required" });
  }
  const normalizedEvent = { provider_id: providerId, event_id: eventId, amount, currency, status };
  return send(res, 200, await persistEvent(normalizedEvent));
}
async function handleDemoEvent(req, res) {
  if (!ENABLE_PUBLIC_DEMO) return send(res, 404, { error: "Demo endpoint disabled" });
  if (req.headers.origin !== DEMO_ORIGIN) return send(res, 403, { error: "Origin not allowed" });
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const bucket = demoRequests.get(ip);
  if (bucket && now - bucket.startedAt < 60000 && bucket.count >= 20) return send(res, 429, { error: "Demo rate limit exceeded; try again in one minute" });
  if (!bucket || now - bucket.startedAt >= 60000) demoRequests.set(ip, { startedAt: now, count: 1 });
  else bucket.count++;
  const rawBody = await readBody(req);
  let input;
  try { input = JSON.parse(rawBody.toString("utf8")); }
  catch { return send(res, 400, { error: "Invalid JSON" }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return send(res, 422, { error: "Event must be a JSON object" });
  const eventId = typeof input.event_id === "string" ? input.event_id.trim() : "";
  const amount = Number(input.amount);
  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  const statusMap = { SUCCEEDED: "SUCCESS", SUCCESS: "SUCCESS", PENDING: "PENDING", FAILED: "FAILED" };
  const status = statusMap[String(input.status || "").trim().toUpperCase()];
  if (!eventId || eventId.length > 256 || !Number.isFinite(amount) || amount <= 0 ||
      !/^[A-Z]{3}$/.test(currency) || !status) {
    return send(res, 422, { error: "event_id, positive amount, ISO currency and supported status are required" });
  }
  const event = { provider_id: "demo-provider", event_id: eventId, amount, currency, status };
  const key = JSON.stringify([event.provider_id, event.event_id]);
  if (demoEvents.has(key)) {
    return send(res, 200, { decision: "REJECT", reason: "Duplicate provider + event identifier", duplicate: true,
      reference: { provider_id: event.provider_id, event_id: event.event_id }, storage: "temporary-demo-memory" });
  }
  const result = screenEvent(event, { reviewThreshold: REVIEW_THRESHOLD });
  demoEvents.set(key, result);
  return send(res, 200, { ...result, duplicate: false,
    reference: { provider_id: event.provider_id, event_id: event.event_id }, storage: "temporary-demo-memory" });
}

function authRateLimited(req) {
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown").split(",")[0].trim();
  const now = Date.now();
  const bucket = authAttempts.get(ip);
  if (!bucket || now - bucket.startedAt >= 15 * 60 * 1000) {
    authAttempts.set(ip, { startedAt: now, count: 1 });
    return false;
  }
  if (bucket.count >= 10) return true;
  bucket.count++;
  return false;
}
function bearerToken(req) {
  const header = String(req.headers.authorization || "");
  const match = /^Bearer ([A-Za-z0-9_-]{40,})$/.exec(header);
  return match ? match[1] : null;
}
async function createUserSession(userId) {
  const token = createSessionToken();
  await pool.query(
    "INSERT INTO app_sessions (user_id, token_hash, expires_at) VALUES ($1,$2,NOW() + INTERVAL '30 days')",
    [userId, hashSessionToken(token)]
  );
  return token;
}
async function handleRegister(req, res) {
  if (!pool) return send(res, 503, { error: "Account service is not configured; database is required" });
  if (authRateLimited(req)) return send(res, 429, { error: "Too many account attempts; try again in 15 minutes" });
  const rawBody = await readBody(req);
  let input;
  try { input = JSON.parse(rawBody.toString("utf8")); } catch { return send(res, 400, { error: "Invalid JSON" }); }
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return send(res, 422, { error: "Enter a valid email address" });
  if (password.length < 12 || password.length > 128) return send(res, 422, { error: "Password must contain 12 to 128 characters" });
  try {
    const passwordHash = await hashPassword(password);
    const created = await pool.query(
      "INSERT INTO app_users (email, password_hash) VALUES ($1,$2) RETURNING id, email, created_at",
      [email, passwordHash]
    );
    const user = created.rows[0];
    const token = await createUserSession(user.id);
    return send(res, 201, { token, token_type: "Bearer", expires_in: 2592000, user: { id: String(user.id), email: user.email, created_at: user.created_at } });
  } catch (error) {
    if (error.code === "23505") return send(res, 409, { error: "An account with this email already exists" });
    throw error;
  }
}
async function handleLogin(req, res) {
  if (!pool) return send(res, 503, { error: "Account service is not configured; database is required" });
  if (authRateLimited(req)) return send(res, 429, { error: "Too many account attempts; try again in 15 minutes" });
  const rawBody = await readBody(req);
  let input;
  try { input = JSON.parse(rawBody.toString("utf8")); } catch { return send(res, 400, { error: "Invalid JSON" }); }
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!email || email.length > 254 || !password || password.length > 128) return send(res, 401, { error: "Email or password is incorrect" });
  const found = await pool.query("SELECT id, email, password_hash, created_at FROM app_users WHERE email=$1", [email]);
  if (!found.rowCount || !(await verifyPassword(password, found.rows[0].password_hash))) {
    return send(res, 401, { error: "Email or password is incorrect" });
  }
  const user = found.rows[0];
  const token = await createUserSession(user.id);
  return send(res, 200, { token, token_type: "Bearer", expires_in: 2592000, user: { id: String(user.id), email: user.email, created_at: user.created_at } });
}
async function handleMe(req, res) {
  if (!pool) return send(res, 503, { error: "Account service is not configured; database is required" });
  const token = bearerToken(req);
  if (!token) return send(res, 401, { error: "Authentication required" });
  const result = await pool.query(
    `SELECT u.id, u.email, u.created_at
     FROM app_sessions s JOIN app_users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
    [hashSessionToken(token)]
  );
  if (!result.rowCount) return send(res, 401, { error: "Session is invalid or expired" });
  const user = result.rows[0];
  return send(res, 200, { user: { id: String(user.id), email: user.email, created_at: user.created_at } });
}
async function handleLogout(req, res) {
  if (!pool) return send(res, 503, { error: "Account service is not configured; database is required" });
  const token = bearerToken(req);
  if (!token) return send(res, 401, { error: "Authentication required" });
  await pool.query("UPDATE app_sessions SET revoked_at=NOW() WHERE token_hash=$1 AND revoked_at IS NULL", [hashSessionToken(token)]);
  return send(res, 200, { status: "signed_out" });
}

const server = createServer(async (req, res) => {
  try {
    cors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (req.method === "GET" && req.url === "/health") {
      if (pool) await pool.query("SELECT 1");
      return send(res, 200, { status: "ok", service: "nexora-payment-integrity-api", mode: pool ? "database" : "demo-only" });
    }
    if (req.method === "GET" && req.url === "/ready") {
      if (!pool) return send(res, 503, { status: "not_ready", reason: "DATABASE_URL is not configured" });
      await pool.query("SELECT 1");
      return send(res, 200, { status: "ready", database: "connected" });
    }
    if (req.method === "POST" && req.url === "/v1/auth/register") return await handleRegister(req, res);
    if (req.method === "POST" && req.url === "/v1/auth/login") return await handleLogin(req, res);
    if (req.method === "GET" && req.url === "/v1/auth/me") return await handleMe(req, res);
    if (req.method === "POST" && req.url === "/v1/auth/logout") return await handleLogout(req, res);
    if (req.method === "POST" && req.url === "/v1/events") return await handleEvent(req, res);
    if (req.method === "POST" && req.url === "/v1/demo/events") return await handleDemoEvent(req, res);
    return send(res, 404, { error: "Not found" });
  } catch (error) {
    console.error("request failed", error);
    return send(res, error.statusCode || 500, { error: error.statusCode === 413 ? "Payload too large" : "Internal server error" });
  }
});
server.listen(PORT, "0.0.0.0", () => console.log("NEXORA Payment Integrity API listening on port " + PORT));
async function shutdown() {
  server.close(async () => { if (pool) await pool.end(); process.exit(0); });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
