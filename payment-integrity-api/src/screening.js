import { createHmac, timingSafeEqual } from "node:crypto";

export function verifySignature({ rawBody, timestamp, signature, secret, now = Date.now(), toleranceSeconds = 300 }) {
  if (!rawBody || !timestamp || !signature || !secret) return false;
  if (!/^\\d{10,13}$/.test(String(timestamp))) return false;
  const timestampMs = String(timestamp).length === 10 ? Number(timestamp) * 1000 : Number(timestamp);
  if (!Number.isFinite(timestampMs) || Math.abs(now - timestampMs) > toleranceSeconds * 1000) return false;
  const expected = createHmac("sha256", secret).update(String(timestamp) + ".").update(rawBody).digest("hex");
  const supplied = String(signature).replace(/^sha256=/, "");
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(supplied, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function signPayload(rawBody, timestamp, secret) {
  return "sha256=" + createHmac("sha256", secret).update(String(timestamp) + ".").update(rawBody).digest("hex");
}

export function screenEvent(event, { reviewThreshold = 10000 } = {}) {
  if (!event || typeof event !== "object" || Array.isArray(event)) return { decision: "REJECT", reason: "Invalid event payload" };
  const providerId = String(event.provider_id ?? "").trim();
  const eventId = String(event.event_id ?? "").trim();
  const amount = Number(event.amount);
  const currency = String(event.currency ?? "").trim().toUpperCase();
  const status = String(event.status ?? "").trim().toUpperCase();
  if (!providerId || !eventId) return { decision: "REJECT", reason: "Missing provider_id or event_id" };
  if (!Number.isFinite(amount) || amount <= 0) return { decision: "REJECT", reason: "Amount must be greater than zero" };
  if (!/^[A-Z]{3}$/.test(currency)) return { decision: "REJECT", reason: "Invalid currency code" };
  if (status === "PENDING") return { decision: "REVIEW", reason: "Event is pending" };
  if (status !== "SUCCESS") return { decision: "REJECT", reason: "Event status is not successful" };
  if (amount >= reviewThreshold) return { decision: "REVIEW", reason: "Amount meets or exceeds the configured review threshold" };
  return { decision: "ACCEPT", reason: "All configured screening checks passed" };
}