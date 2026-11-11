import { screenEvent } from "../../payment-integrity-api/src/screening.js";

const siteOrigin = (request) => new URL(request.url).origin;
const requests = new Map();
const events = new Map();
const threshold = 10000;

export default async (request) => {
  const origin = request.headers.get("origin") || "";
  const allowedOrigin = "https://bnexora7-eng.github.io";
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": allowedOrigin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    "vary": "Origin"
  };
  const reply = (status, body) => new Response(JSON.stringify(body), { status, headers });

  // A browser-openable health check confirms the deployed function is running.
  if (request.method === "GET") {
    return reply(200, {
      status: "ok",
      service: "NEXORA Payment Integrity Demo API",
      version: "0.1.0",
      storage: "temporary-demo-memory",
      supported_methods: ["GET", "POST", "OPTIONS"]
    });
  }

  if (origin && origin !== allowedOrigin) return reply(403, { error: "Origin not allowed" });
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
  if (request.method !== "POST") return reply(405, { error: "Method not allowed" });

  const ip = request.headers.get("x-nf-client-connection-ip") || "unknown";
  const now = Date.now();
  const bucket = requests.get(ip);
  if (bucket && now - bucket.startedAt < 60000 && bucket.count >= 20) {
    return reply(429, { error: "Demo rate limit exceeded; try again in one minute" });
  }
  if (!bucket || now - bucket.startedAt >= 60000) requests.set(ip, { startedAt: now, count: 1 });
  else bucket.count++;

  const raw = await request.text();
  if (raw.length > 65536) return reply(413, { error: "Payload too large" });
  let input;
  try { input = JSON.parse(raw); } catch { return reply(400, { error: "Invalid JSON" }); }
  if (!input || typeof input !== "object" || Array.isArray(input)) return reply(422, { error: "Event must be a JSON object" });

  const eventId = typeof input.event_id === "string" ? input.event_id.trim() : "";
  const amount = Number(input.amount);
  const currency = typeof input.currency === "string" ? input.currency.trim().toUpperCase() : "";
  const statusMap = { SUCCEEDED: "SUCCESS", SUCCESS: "SUCCESS", PENDING: "PENDING", FAILED: "FAILED" };
  const status = statusMap[String(input.status || "").trim().toUpperCase()];
  if (!eventId || eventId.length > 256 || !Number.isFinite(amount) || amount <= 0 ||
      !/^[A-Z]{3}$/.test(currency) || !status) {
    return reply(422, { error: "event_id, positive amount, ISO currency and supported status are required" });
  }

  const event = { provider_id: "demo-provider", event_id: eventId, amount, currency, status };
  const key = JSON.stringify([event.provider_id, event.event_id]);
  if (events.has(key)) {
    return reply(200, { decision: "REJECT", reason: "Duplicate provider + event identifier", duplicate: true,
      reference: { provider_id: event.provider_id, event_id: event.event_id }, storage: "temporary-demo-memory" });
  }
  const result = screenEvent(event, { reviewThreshold: threshold });
  events.set(key, result);
  return reply(200, { ...result, duplicate: false,
    reference: { provider_id: event.provider_id, event_id: event.event_id }, storage: "temporary-demo-memory" });
};
