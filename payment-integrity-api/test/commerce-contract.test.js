import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const server = await readFile(new URL("../src/server.js", import.meta.url), "utf8");
const schema = await readFile(new URL("../src/schema.sql", import.meta.url), "utf8");
const account = await readFile(new URL("../../account/index.html", import.meta.url), "utf8");
const workspace = await readFile(new URL("../../account/payment-integrity.html", import.meta.url), "utf8");

test("checkout requires an authenticated user and an active server-priced product", () => {
  const handler = server.slice(server.indexOf("async function handleGumroadCheckout"), server.indexOf("async function handleGumroadPing"));
  assert.ok(handler.indexOf("requireUser(req,res)") < handler.indexOf("SELECT product_id"));
  assert.match(handler, /active=TRUE AND price_amount IS NOT NULL/);
  assert.match(handler, /GUMROAD_PRODUCT_URL/);
  assert.match(handler, /already has access to this product/);
});

test("Gumroad ping never trusts the submitted sale fields", () => {
  const handler = server.slice(server.indexOf("async function handleGumroadPing"), server.indexOf("async function handleProductCatalogue"));
  assert.match(handler, /GUMROAD_PING_SECRET/);
  assert.match(handler, /timingSafeEqual/);
  assert.match(handler, /api\.gumroad\.com\/v2\/sales\//);
  assert.match(handler, /verified\?\.success!==true/);
  assert.match(handler, /sale\.seller_id/);
  assert.match(handler, /sale\.product_id/);
  assert.match(handler, /sale\.email\|\|sale\.purchase_email/);
  assert.match(handler, /priceCents!==expectedPrice/);
});

test("verified Gumroad sales are idempotent and refund or dispute state revokes access", () => {
  const handler = server.slice(server.indexOf("async function handleGumroadPing"), server.indexOf("async function handleProductCatalogue"));
  assert.match(handler, /payment_provider='gumroad'/);
  assert.match(handler, /provider_payment_id/);
  assert.match(handler, /sale\.refunded \|\| sale\.chargedback/);
  assert.match(handler, /sale\.disputed && !sale\.dispute_won/);
  assert.match(handler, /UPDATE product_entitlements SET revoked_at/);
  assert.match(handler, /INSERT INTO product_entitlements/);
  assert.match(handler, /ON CONFLICT DO NOTHING/);
});

test("catalogue starts inactive and customer grants are unique and revocable", () => {
  assert.match(schema, /NULL,'USD',FALSE/);
  assert.match(schema, /order_id UUID NOT NULL UNIQUE REFERENCES own_payments/);
  assert.match(schema, /WHERE revoked_at IS NULL/);
  assert.match(schema, /provider_payment_id TEXT/);
});

test("private workspace requires an entitlement and scopes history to the user", () => {
  const handler = server.slice(server.indexOf("async function handleCustomerScreenings"), server.indexOf("async function handleMyProducts"));
  assert.match(handler, /hasActiveProduct\(user\.id,"payment-integrity"\)/);
  assert.match(handler, /WHERE user_id=\$1 ORDER BY created_at DESC LIMIT 100/);
  assert.match(server, /\/v1\/account\/payment-integrity\/events/);
  assert.match(schema, /UNIQUE \(user_id,provider_id,event_id\)/);
  assert.match(account, /OPEN YOUR PAYMENT INTEGRITY WORKSPACE/);
  assert.match(workspace, /active Payment Integrity purchase entitlement/);
});

test("account dashboard only opens Gumroad checkout when catalogue item is active", () => {
  assert.match(account, /available\.some\(p=>p\.product_id==="payment-integrity"\)/);
  assert.match(account, /request\("\/v1\/payments\/checkout"/);
  assert.match(server, /req\.url === "\/v1\/payments\/checkout"/);
});
