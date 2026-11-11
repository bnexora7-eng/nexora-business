import { createServer } from "node:http";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { screenEvent, verifySignature } from "./screening.js";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL;
const PROVIDER_SECRETS = JSON.parse(process.env.PROVIDER_SECRETS || "{}");
const ENABLE_PUBLIC_DEMO = process.env.ENABLE_PUBLIC_DEMO === "true";
const REVIEW_THRESHOLD = Number(process.env.REVIEW_THRESHOLD || 10000);
const MAX_BODY_BYTES = 65536;
const DEMO_ORIGIN = process.env.DEMO_ORIGIN || "https://bnexora7-eng.github.io";
const demoRequests = new Map();
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!Object.keys(PROVIDER_SECRETS).length && !ENABLE_PUBLIC_DEMO) throw new Error("PROVIDER_SECRETS must contain a provider secret when public demo is disabled");
const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined });
await pool.query(await readFile(new URL("./schema.sql", import.meta.url), "utf8"));
console.log("NEXORA database schema is ready");

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
    res.setHeader("access-control-allow-headers", "content-type, x-nexora-timestamp, x-nexora-signature");
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
  const normalizedEvent = { provider_id: "demo-provider", event_id: eventId, amount, currency, status };
  return send(res, 200, await persistEvent(normalizedEvent));
}
const server = createServer(async (req, res) => {
  try {
    cors(req, res);
    if (req.method === "OPTIONS") { res.writeHead(204); return res.end(); }
    if (req.method === "GET" && req.url === "/health") {
      await pool.query("SELECT 1");
      return send(res, 200, { status: "ok", service: "nexora-payment-integrity-api" });
    }
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
  server.close(async () => { await pool.end(); process.exit(0); });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);