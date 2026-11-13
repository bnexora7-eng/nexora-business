import { createServer } from "node:http";
import crypto from "node:crypto";
import pg from "pg";
import { readFile } from "node:fs/promises";
import { screenEvent, verifySignature } from "./screening.js";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "./auth.js";
const { Pool } = pg;
const PORT = Number(process.env.PORT || 8080);
const DATABASE_URL = process.env.DATABASE_URL;
const PGSSL = process.env.PGSSL;
let PROVIDER_SECRETS = {};
try {
  PROVIDER_SECRETS = JSON.parse(process.env.PROVIDER_SECRETS || "{}");
  if (!PROVIDER_SECRETS || typeof PROVIDER_SECRETS !== "object" || Array.isArray(PROVIDER_SECRETS)) {
    throw new Error("PROVIDER_SECRETS must be a JSON object");
  }
} catch (error) {
  console.error("Invalid PROVIDER_SECRETS configuration:", error.message);
  process.exit(1);
}
const databaseSsl = PGSSL === "true" ? {} : PGSSL === "false" ? false : undefined;
const ENABLE_PUBLIC_DEMO = process.env.ENABLE_PUBLIC_DEMO === "true";
const REVIEW_THRESHOLD = Number(process.env.REVIEW_THRESHOLD || 10000);
const MAX_BODY_BYTES = 65536;
const DEMO_ORIGIN = process.env.DEMO_ORIGIN || "https://bnexora7-eng.github.io";
const ALLOWED_ORIGINS = new Set((process.env.ALLOWED_ORIGINS || "https://bnexora7-eng.github.io,https://splendid-lokum-02523e.netlify.app").split(",").map(value => value.trim()).filter(Boolean));
ALLOWED_ORIGINS.add(DEMO_ORIGIN);
const demoRequests = new Map();
const demoEvents = new Map();
const authAttempts = new Map();
const MOLLIE_API_BASE = "https://api.mollie.com/v2";
const PUBLIC_API_URL = (process.env.PUBLIC_API_URL || "https://nexora-payment-integrity-api.onrender.com").replace(/\/$/, "");
const PAYMENT_RETURN_URL = process.env.NEXORA_PAYMENT_RETURN_URL || "https://bnexora7-eng.github.io/nexora-business/";
const AI_API_KEY = process.env.OPENAI_API_KEY || "";
const AI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const AI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const aiRequests = new Map();
let pool = null;

// The public demo is deliberately self-contained and can run without PostgreSQL.
// Authenticated provider webhooks still require DATABASE_URL and persistent storage.
if (DATABASE_URL) {
  // Set PGSSL=false for Render's private internal PostgreSQL URL.
  // Set PGSSL=true for an external PostgreSQL provider that requires TLS.
  // When PGSSL is unset, node-postgres follows the connection URL's SSL settings.
  pool = new Pool({ connectionString: DATABASE_URL, ...(databaseSsl === undefined ? {} : { ssl: databaseSsl }) });
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
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("access-control-allow-origin", origin);
    res.setHeader("vary", "Origin");
    res.setHeader("access-control-allow-methods", "GET, POST, PUT, OPTIONS");
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
async function getAuthenticatedUser(req) {
  if (!pool) return null;
  const token = bearerToken(req);
  if (!token) return null;
  const result = await pool.query(
    `SELECT u.id, u.email FROM app_sessions s JOIN app_users u ON u.id=s.user_id
     WHERE s.token_hash=$1 AND s.revoked_at IS NULL AND s.expires_at > NOW()`,
    [hashSessionToken(token)]
  );
  return result.rows[0] || null;
}
async function mollieRequest(path, options = {}) {
  const apiKey = process.env.MOLLIE_API_KEY;
  if (!apiKey) throw Object.assign(new Error("Mollie is not configured"), { statusCode: 503 });
  const response = await fetch(MOLLIE_API_BASE + path, {
    ...options,
    headers: {
      Authorization: "Bearer " + apiKey,
      Accept: "application/hal+json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Mollie API error", response.status, data?.title || data?.detail || "unknown");
    throw Object.assign(new Error("Payment provider could not create or retrieve the payment"), { statusCode: 502 });
  }
  return data;
}
async function handleCreatePayment(req, res) {
  if (!pool) return send(res, 503, { error: "Payment service requires the database" });
  const user = await getAuthenticatedUser(req);
  if (!user) return send(res, 401, { error: "Sign in to create an order" });
  if (!process.env.MOLLIE_API_KEY) return send(res, 503, { error: "Payment provider is not configured yet" });
  if (!process.env.MOLLIE_API_KEY.startsWith("test_") && !(process.env.MOLLIE_API_KEY.startsWith("live_") && process.env.ENABLE_LIVE_PAYMENTS === "true")) return send(res, 503, { error: "Live payments are disabled; configure a Mollie test key first" });
  const rawBody = await readBody(req);
  let input;
  try { input = JSON.parse(rawBody.toString("utf8")); } catch { return send(res, 400, { error: "Invalid JSON" }); }
  const productId = typeof input?.product_id === "string" ? input.product_id.trim() : "";
  if (!productId || productId.length > 80) return send(res, 422, { error: "A valid product_id is required" });
  const productResult = await pool.query(
    "SELECT product_id,name,description,price_eur,currency FROM product_catalog WHERE product_id=$1 AND active=TRUE AND price_eur IS NOT NULL",
    [productId]
  );
  if (!productResult.rowCount) return send(res, 409, { error: "This product is not available for purchase yet" });
  const product = productResult.rows[0];
  const owned = await pool.query("SELECT 1 FROM product_entitlements WHERE user_id=$1 AND product_id=$2 AND revoked_at IS NULL LIMIT 1",[user.id,product.product_id]);
  if (owned.rowCount) return send(res,409,{error:"This account already has access to this product"});
  const amount = Number(product.price_eur).toFixed(2);
  const orderId = crypto.randomUUID();
  await pool.query(
    `INSERT INTO own_payments (order_id,user_id,product_id,amount,currency,description,status)
     VALUES ($1,$2,$3,$4,$5,$6,'creating')`,
    [orderId,user.id,product.product_id,amount,product.currency,product.name]
  );
  try {
    const payment = await mollieRequest("/payments", {
      method: "POST",
      body: JSON.stringify({
        amount: { currency: product.currency, value: amount },
        description: "NEXORA " + product.name,
        redirectUrl: PAYMENT_RETURN_URL + "?payment_id=" + encodeURIComponent(orderId),
        webhookUrl: PUBLIC_API_URL + "/v1/payments/mollie-webhook",
        metadata: { order_id: orderId, user_id: String(user.id), product_id: product.product_id }
      })
    });
    const checkoutUrl = payment?._links?.checkout?.href;
    if (!payment?.id || !checkoutUrl) throw new Error("Payment provider returned an incomplete checkout response");
    await pool.query(
      `UPDATE own_payments SET mollie_payment_id=$1,status=$2,checkout_url=$3,updated_at=NOW()
       WHERE order_id=$4`,
      [payment.id,payment.status||"open",checkoutUrl,orderId]
    );
    return send(res,201,{order_id:orderId,product_id:product.product_id,status:payment.status||"open",
      amount:{currency:product.currency,value:amount},checkout_url:checkoutUrl,mode:payment.mode||"unknown"});
  } catch(error) {
    await pool.query("UPDATE own_payments SET status='creation_failed',updated_at=NOW() WHERE order_id=$1",[orderId]);
    throw error;
  }
}
async function handleProductCatalogue(req,res) {
  if(!pool) return send(res,503,{error:"Product catalogue requires the database"});
  const result=await pool.query(
    "SELECT product_id,name,description,price_eur,currency,active FROM product_catalog ORDER BY name"
  );
  return send(res,200,{products:result.rows.map(p=>({...p,price:p.price_eur===null?null:Number(p.price_eur).toFixed(2)}))});
}
async function hasActiveProduct(userId,productId) {
  const result=await pool.query(
    "SELECT 1 FROM product_entitlements WHERE user_id=$1 AND product_id=$2 AND revoked_at IS NULL LIMIT 1",
    [userId,productId]
  );
  return result.rowCount>0;
}
async function handleCustomerScreenings(req,res) {
  const user=await requireUser(req,res); if(!user) return;
  if(!await hasActiveProduct(user.id,"payment-integrity")) return send(res,403,{error:"An active Payment Integrity entitlement is required"});
  if(req.method==="GET") {
    const result=await pool.query(
      `SELECT id,provider_id,event_id,amount,currency,event_status,decision,reason,created_at
       FROM customer_screenings WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,
      [user.id]
    );
    return send(res,200,{events:result.rows});
  }
  if(req.method!=="POST") return send(res,405,{error:"Method not allowed"});
  const raw=await readBody(req); let input;
  try{input=JSON.parse(raw.toString("utf8"));}catch{return send(res,400,{error:"Invalid JSON"});}
  const providerId=typeof input?.provider_id==="string"?input.provider_id.trim():"";
  const eventId=typeof input?.event_id==="string"?input.event_id.trim():"";
  const amount=Number(input?.amount);
  const currency=typeof input?.currency==="string"?input.currency.trim().toUpperCase():"";
  const status=typeof input?.status==="string"?input.status.trim().toUpperCase():"";
  if(!providerId||providerId.length>128||!eventId||eventId.length>256||!Number.isFinite(amount)||amount<=0||amount>100000000||!/^[A-Z]{3}$/.test(currency)||!["SUCCESS","PENDING","FAILED"].includes(status)) {
    return send(res,422,{error:"Provide provider_id, event_id, a positive amount, ISO currency and SUCCESS, PENDING or FAILED status"});
  }
  const event={provider_id:providerId,event_id:eventId,amount,currency,status};
  const screened=screenEvent(event,{reviewThreshold:REVIEW_THRESHOLD});
  const result=await pool.query(
    `INSERT INTO customer_screenings(user_id,provider_id,event_id,amount,currency,event_status,decision,reason)
     VALUES($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT(user_id,provider_id,event_id) DO NOTHING
     RETURNING id,provider_id,event_id,amount,currency,event_status,decision,reason,created_at`,
    [user.id,providerId,eventId,amount,currency,status,screened.decision,screened.reason]
  );
  if(!result.rowCount) return send(res,200,{duplicate:true,decision:"REJECT",reason:"Duplicate provider + event identifier",reference:{provider_id:providerId,event_id:eventId}});
  return send(res,201,{duplicate:false,...result.rows[0]});
}
async function handleMyProducts(req,res) {
  const user=await requireUser(req,res); if(!user) return;
  const result=await pool.query(
    `SELECT e.product_id,p.name,p.description,e.order_id,e.granted_at
     FROM product_entitlements e JOIN product_catalog p ON p.product_id=e.product_id
     WHERE e.user_id=$1 AND e.revoked_at IS NULL ORDER BY e.granted_at DESC`,
    [user.id]
  );
  return send(res,200,{products:result.rows});
}
async function handleMollieWebhook(req, res) {
  if (!pool || !process.env.MOLLIE_API_KEY) return send(res,503,{error:"Payment webhook is not configured"});
  const rawBody=await readBody(req);
  const params=new URLSearchParams(rawBody.toString("utf8"));
  const molliePaymentId=params.get("id");
  if(!molliePaymentId||!/^tr_[A-Za-z0-9]+$/.test(molliePaymentId)) return send(res,400,{error:"Invalid payment identifier"});
  const payment=await mollieRequest("/payments/"+encodeURIComponent(molliePaymentId));
  const orderId=payment?.metadata?.order_id;
  if(payment?.resource!=="payment"||typeof orderId!=="string") return send(res,400,{error:"Payment metadata is invalid"});
  const client=await pool.connect();
  try {
    await client.query("BEGIN");
    const existing=await client.query(
      "SELECT order_id,user_id,product_id,amount,currency,mollie_payment_id FROM own_payments WHERE order_id=$1 FOR UPDATE",[orderId]
    );
    if(!existing.rowCount||existing.rows[0].mollie_payment_id!==molliePaymentId) {
      await client.query("ROLLBACK"); return send(res,404,{error:"Payment order not found"});
    }
    const order=existing.rows[0];
    if(!order.user_id||!order.product_id ||
       String(payment.metadata?.user_id)!==String(order.user_id) ||
       payment.metadata?.product_id!==order.product_id) {
      await client.query("ROLLBACK"); return send(res,409,{error:"Payment metadata does not match the stored customer order"});
    }
    const expectedAmount=Number(order.amount).toFixed(2);
    if(payment.amount?.currency!==order.currency||payment.amount?.value!==expectedAmount) {
      await client.query("ROLLBACK"); console.error("Mollie payment amount mismatch",molliePaymentId);
      return send(res,409,{error:"Payment amount mismatch"});
    }
    const allowed=new Set(["open","pending","authorized","paid","canceled","expired","failed","refunded","charged_back"]);
    if(!allowed.has(payment.status)) {
      await client.query("ROLLBACK"); return send(res,422,{error:"Unsupported payment status"});
    }
    await client.query("UPDATE own_payments SET status=$1,updated_at=NOW() WHERE order_id=$2",[payment.status,orderId]);
    if(payment.status==="paid") {
      await client.query(
        `INSERT INTO product_entitlements (user_id,product_id,order_id)
         VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`,
        [order.user_id,order.product_id,order.order_id]
      );
    } else if(payment.status==="refunded"||payment.status==="charged_back") {
      await client.query(
        `UPDATE product_entitlements SET revoked_at=COALESCE(revoked_at,NOW()),revoke_reason=$1
         WHERE order_id=$2`,
        [payment.status,order.order_id]
      );
    }
    await client.query("COMMIT");
    return send(res,200,{received:true,order_status:payment.status,access_granted:payment.status==="paid"});
  } catch(error) {
    await client.query("ROLLBACK"); throw error;
  } finally { client.release(); }
}
async function handleGetPayment(req, res, orderId) {
  if (!pool) return send(res, 503, { error: "Payment service requires the database" });
  const user = await getAuthenticatedUser(req);
  if (!user) return send(res, 401, { error: "Authentication required" });
  const result = await pool.query(
    `SELECT order_id,amount,currency,description,status,created_at,updated_at
     FROM own_payments WHERE order_id=$1 AND user_id=$2`,
    [orderId,user.id]
  );
  if (!result.rowCount) return send(res, 404, { error: "Payment not found" });
  const p = result.rows[0];
  return send(res, 200, {
    order_id: p.order_id, amount: { currency: p.currency, value: Number(p.amount).toFixed(2) },
    description: p.description, status: p.status, created_at: p.created_at, updated_at: p.updated_at,
    paid: p.status === "paid"
  });
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

async function deleteUserAccount(userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    // Keep only legally required payment ledger fields; permanently detach them from the deleted account.
    await client.query("UPDATE own_payments SET user_id=NULL WHERE user_id=$1", [userId]);
    await client.query("DELETE FROM app_users WHERE id=$1", [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function handleDeleteAccount(req, res) {
  if (!pool) return send(res, 503, { error: "Account service is not configured; database is required" });
  const user = await getAuthenticatedUser(req);
  if (!user) return send(res, 401, { error: "Authentication required" });
  await deleteUserAccount(user.id);
  return send(res, 200, { status: "account_deleted", retained: "Unlinked payment records may be retained where legally required." });
}

async function handleWebAccountDeletion(req, res) {
  if (!pool) return send(res, 503, { error: "Account service is not configured; database is required" });
  if (authRateLimited(req)) return send(res, 429, { error: "Too many account attempts; try again in 15 minutes" });
  const rawBody = await readBody(req);
  let input;
  try { input = JSON.parse(rawBody.toString("utf8")); } catch { return send(res, 400, { error: "Invalid JSON" }); }
  const email = typeof input?.email === "string" ? input.email.trim().toLowerCase() : "";
  const password = typeof input?.password === "string" ? input.password : "";
  if (!email || email.length > 254 || !password || password.length > 128) return send(res, 401, { error: "Email or password is incorrect" });
  const found = await pool.query("SELECT id,password_hash FROM app_users WHERE email=$1", [email]);
  if (!found.rowCount || !(await verifyPassword(password, found.rows[0].password_hash))) {
    return send(res, 401, { error: "Email or password is incorrect" });
  }
  await deleteUserAccount(found.rows[0].id);
  return send(res, 200, { status: "account_deleted", retained: "Unlinked payment records may be retained where legally required." });
}


async function requireUser(req, res) {
  if (!pool) { send(res, 503, { error: "Database is not configured" }); return null; }
  const user = await getAuthenticatedUser(req);
  if (!user) { send(res, 401, { error: "Sign in to use this feature" }); return null; }
  return user;
}
async function handleCommunity(req, res) {
  if (req.method === "GET") {
    if (!pool) return send(res, 503, { error: "Community database is not configured" });
    const result = await pool.query(
      `SELECT p.id,p.body,p.created_at FROM community_posts p ORDER BY p.created_at DESC LIMIT 50`
    );
    return send(res, 200, { posts: result.rows });
  }
  if (req.method === "POST") {
    const user = await requireUser(req,res); if (!user) return;
    const raw = await readBody(req); let input;
    try { input = JSON.parse(raw.toString("utf8")); } catch { return send(res,400,{error:"Invalid JSON"}); }
    const body = typeof input?.body === "string" ? input.body.trim() : "";
    if (!body || body.length > 1000) return send(res,422,{error:"Post must contain 1 to 1000 characters"});
    const result = await pool.query(
      "INSERT INTO community_posts (user_id,body) VALUES ($1,$2) RETURNING id,body,created_at",
      [user.id,body]
    );
    return send(res,201,{post:result.rows[0]});
  }
  return send(res,405,{error:"Method not allowed"});
}
async function handleMarketplace(req, res) {
  if (req.method === "GET") {
    if (!pool) return send(res,503,{error:"Marketplace database is not configured"});
    const result = await pool.query(
      `SELECT l.id,l.title,l.description,l.category,l.price,l.currency,l.created_at
       FROM marketplace_listings l
       WHERE l.status='active' ORDER BY l.created_at DESC LIMIT 100`
    );
    return send(res,200,{listings:result.rows});
  }
  if (req.method === "POST") {
    const user = await requireUser(req,res); if (!user) return;
    const raw=await readBody(req); let input;
    try { input=JSON.parse(raw.toString("utf8")); } catch { return send(res,400,{error:"Invalid JSON"}); }
    const title=typeof input?.title==="string"?input.title.trim():"";
    const description=typeof input?.description==="string"?input.description.trim():"";
    const category=typeof input?.category==="string"?input.category.trim():"";
    const priceText=String(input?.price??"").trim().replace(",",".");
    const price=Number(priceText);
    if (!title||title.length>100||description.length<5||description.length>1000||!["service","product","digital"].includes(category)||!/^\d{1,7}(?:\.\d{1,2})?$/.test(priceText)||!Number.isFinite(price)||price<0||price>1000000) {
      return send(res,422,{error:"Check title, description, category and EUR price"});
    }
    const result=await pool.query(
      `INSERT INTO marketplace_listings (user_id,title,description,category,price)
       VALUES ($1,$2,$3,$4,$5) RETURNING id,title,description,category,price,currency,created_at`,
      [user.id,title,description,category,price]
    );
    return send(res,201,{listing:result.rows[0]});
  }
  return send(res,405,{error:"Method not allowed"});
}
async function handleBusinessWorkspace(req,res) {
  const user=await requireUser(req,res); if(!user) return;
  if(req.method==="GET") {
    const result=await pool.query(
      "SELECT business_name,tagline,goals,updated_at FROM business_workspaces WHERE user_id=$1",
      [user.id]
    );
    return send(res,200,{workspace:result.rows[0]||{business_name:"",tagline:"",goals:""}});
  }
  if(req.method==="PUT") {
    const raw=await readBody(req); let input;
    try { input=JSON.parse(raw.toString("utf8")); } catch { return send(res,400,{error:"Invalid JSON"}); }
    const businessName=typeof input?.business_name==="string"?input.business_name.trim():"";
    const tagline=typeof input?.tagline==="string"?input.tagline.trim():"";
    const goals=typeof input?.goals==="string"?input.goals.trim():"";
    if(businessName.length>100||tagline.length>180||goals.length>4000) return send(res,422,{error:"Workspace fields exceed allowed length"});
    const result=await pool.query(
      `INSERT INTO business_workspaces (user_id,business_name,tagline,goals)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (user_id) DO UPDATE SET business_name=EXCLUDED.business_name,tagline=EXCLUDED.tagline,goals=EXCLUDED.goals,updated_at=NOW()
       RETURNING business_name,tagline,goals,updated_at`,
      [user.id,businessName,tagline,goals]
    );
    return send(res,200,{workspace:result.rows[0]});
  }
  return send(res,405,{error:"Method not allowed"});
}

async function handleBusinessAIPlan(req,res) {
  const user=await requireUser(req,res); if(!user) return;
  if(req.method!=="POST") return send(res,405,{error:"Method not allowed"});
  if(!AI_API_KEY) return send(res,503,{error:"AI planning is not configured yet. The secure model key must be added to the server environment."});
  const now=Date.now();
  const recent=(aiRequests.get(user.id)||[]).filter(t=>now-t<60000);
  if(recent.length>=4) return send(res,429,{error:"AI usage limit reached. Please wait a minute and try again."});
  recent.push(now); aiRequests.set(user.id,recent);
  const raw=await readBody(req); let input;
  try { input=JSON.parse(raw.toString("utf8")); } catch { return send(res,400,{error:"Invalid JSON"}); }
  const fields=["business_name","industry","customer","problem","offer","budget","duration_days"];
  const values={};
  for(const key of fields) {
    const value=input?.[key];
    if(value!==undefined && typeof value!=="string" && typeof value!=="number") return send(res,422,{error:"Business plan fields must be text or numbers"});
    values[key]=String(value??"").trim();
    if(values[key].length>1200) return send(res,422,{error:"One of the business plan fields is too long"});
  }
  if(!values.problem && !values.offer && !values.industry) return send(res,422,{error:"Add at least an industry, customer problem or offer before generating a plan"});
  const prompt=fields.map(k=>k+": "+(values[k]||"Not provided")).join("\n");
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),25000);
  try {
    const response=await fetch(AI_API_URL,{
      method:"POST",signal:controller.signal,
      headers:{"Authorization":"Bearer "+AI_API_KEY,"Content-Type":"application/json"},
      body:JSON.stringify({model:AI_MODEL,temperature:0.4,max_tokens:1400,messages:[
        {role:"system",content:"You are NEXORA Business Studio, a practical business-planning assistant. Reply in the same language as the user, or Polish if unclear. Create a concise realistic plan with: positioning, target customer and problem, offer and differentiation, first five validation actions, phased timeline matching requested duration, lean budget allocation not exceeding stated budget, measurable KPIs, top risks and mitigations, and one next action. Distinguish assumptions from facts. Do not invent market research, customers, prices, legal permissions or guaranteed results. Do not provide definitive legal, tax or investment advice. If information is missing, state assumptions and ask focused follow-up questions."},
        {role:"user",content:"Prepare my business plan using these details:\n"+prompt}
      ]})
    });
    const data=await response.json().catch(()=>({}));
    if(!response.ok) { console.error("AI provider error",response.status); return send(res,502,{error:"The AI provider could not complete the request. Please try again later."}); }
    const plan=data?.choices?.[0]?.message?.content;
    if(typeof plan!=="string"||!plan.trim()) return send(res,502,{error:"The AI provider returned an empty plan"});
    return send(res,200,{plan:plan.trim(),model:AI_MODEL,generated_at:new Date().toISOString()});
  } catch(error) { console.error("AI request failed",error.name||"Error"); return send(res,504,{error:"AI planning timed out or is temporarily unavailable"}); }
  finally { clearTimeout(timeout); }
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
    if (req.method === "DELETE" && req.url === "/v1/auth/account") return await handleDeleteAccount(req, res);
    if (req.method === "POST" && req.url === "/v1/auth/delete-request") return await handleWebAccountDeletion(req, res);
    if (req.url === "/v1/community/posts") return await handleCommunity(req,res);
    if (req.url === "/v1/marketplace/listings") return await handleMarketplace(req,res);
    if (req.url === "/v1/business/workspace") return await handleBusinessWorkspace(req,res);
    if (req.url === "/v1/business/ai-plan") return await handleBusinessAIPlan(req,res);
    if (req.method === "GET" && req.url === "/v1/catalogue/products") return await handleProductCatalogue(req,res);
    if (req.method === "GET" && req.url === "/v1/account/products") return await handleMyProducts(req,res);
    if ((req.method === "GET" || req.method === "POST") && req.url === "/v1/account/payment-integrity/events") return await handleCustomerScreenings(req,res);
    if (req.method === "POST" && req.url === "/v1/payments") return await handleCreatePayment(req, res);
    if (req.method === "POST" && req.url === "/v1/payments/mollie-webhook") return await handleMollieWebhook(req, res);
    const paymentStatusMatch = /^\/v1\/payments\/([0-9a-f-]{36})$/.exec(req.url || "");
    if (req.method === "GET" && paymentStatusMatch) return await handleGetPayment(req, res, paymentStatusMatch[1]);
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
