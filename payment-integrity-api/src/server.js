import { createServer } from "node:http";
import pg from "pg";
import { screenEvent, verifySignature } from "./screening.js";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL;
const PROVIDER_SECRETS = JSON.parse(process.env.PROVIDER_SECRETS || "{}");
const REVIEW_THRESHOLD = Number(process.env.REVIEW_THRESHOLD || 10000);
const MAX_BODY_BYTES = 65536;
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!Object.keys(PROVIDER_SECRETS).length) throw new Error("PROVIDER_SECRETS must contain a provider secret");
const pool = new Pool({ connectionString: DATABASE_URL, ssl: process.env.PGSSL === "true" ? { rejectUnauthorized: true } : undefined });

function send(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
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
  const timestamp = req.headers["x-nexora-timestamp"];
  const signature = req.headers["x-nexora-signature"];
  if (!verifySignature({ rawBody, timestamp, signature, secret })) return send(res, 401, { error: "Invalid or expired webhook signature" });
  if (!eventId || eventId.length > 256 || providerId.length > 128 ||
      !Number.isFinite(amount) || amount <= 0 || !/^[A-Z]{3}$/.test(currency) || !status || status.length > 32) {
    return send(res, 422, { error: "provider_id (max 128 chars), event_id (max 256 chars), positive amount, ISO currency code and status (max 32 chars) are required" });
  }

  // Persist only fields required for screening; discard arbitrary provider/customer metadata.
  const normalizedEvent = { provider_id: providerId, event_id: eventId, amount, currency, status };
  const result = screenEvent(normalizedEvent, { reviewThreshold: REVIEW_THRESHOLD });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const inserted = await client.query(
      `INSERT INTO screened_events (provider_id,event_id,amount,currency,event_status,decision,reason,payload)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
       ON CONFLICT (provider_id,event_id) DO NOTHING RETURNING id`,
      [providerId, eventId, amount, currency, status, result.decision, result.reason, JSON.stringify(normalizedEvent)]
    );
    const duplicate = inserted.rowCount === 0;
    const decision = duplicate ? "REJECT" : result.decision;
    const reason = duplicate ? "Duplicate provider + event identifier" : result.reason;
    await client.query(
      `INSERT INTO screening_audit (provider_id,event_id,decision,reason,is_duplicate,request_payload)
       VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
      [providerId, eventId, decision, reason, duplicate, JSON.stringify(normalizedEvent)]
    );
    await client.query("COMMIT");
    return send(res, 200, { decision, reason, duplicate, reference: { provider_id: providerId, event_id: eventId } });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("screening transaction failed", error);
    return send(res, 500, { error: "Screening could not be completed" });
  } finally { client.release(); }
}
const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/health") {
      await pool.query("SELECT 1");
      return send(res, 200, { status: "ok", service: "nexora-payment-integrity-api" });
    }
    if (req.method === "POST" && req.url === "/v1/events") return await handleEvent(req, res);
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