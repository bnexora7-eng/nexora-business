import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const server = await readFile(new URL("../src/server.js", import.meta.url), "utf8");
const schema = await readFile(new URL("../src/schema.sql", import.meta.url), "utf8");
const account = await readFile(new URL("../../account/index.html", import.meta.url), "utf8");

test("orders require an authenticated user before product lookup", () => {
  const handler = server.slice(server.indexOf("async function handleCreatePayment"), server.indexOf("async function handleProductCatalogue"));
  assert.ok(handler.indexOf("getAuthenticatedUser(req)") < handler.indexOf("SELECT product_id"));
  assert.match(handler, /if \(!user\) return send\(res, 401/);
});

test("order price and description come from the server-owned catalogue", () => {
  const handler = server.slice(server.indexOf("async function handleCreatePayment"), server.indexOf("async function handleProductCatalogue"));
  assert.match(handler, /WHERE product_id=\$1 AND active=TRUE AND price_eur IS NOT NULL/);
  assert.match(handler, /Number\(product\.price_eur\)\.toFixed\(2\)/);
  assert.doesNotMatch(handler, /input\?\.amount|input\?\.description/);
});

test("only verified paid provider status grants access, idempotently", () => {
  const handler = server.slice(server.indexOf("async function handleMollieWebhook"), server.indexOf("async function handleGetPayment"));
  assert.match(handler, /payment\.status==="paid"/);
  assert.match(handler, /INSERT INTO product_entitlements/);
  assert.match(handler, /ON CONFLICT DO NOTHING/);
  assert.match(handler, /payment\.amount\?\.currency/);
  assert.match(handler, /payment\.metadata\?\.user_id/);
  assert.match(handler, /payment\.status==="refunded"\|\|payment\.status==="charged_back"/);
  assert.match(handler, /UPDATE product_entitlements SET revoked_at/);
});

test("catalogue starts inactive and entitlement records are unique per order", () => {
  assert.match(schema, /NULL,'EUR',FALSE/);
  assert.match(schema, /order_id UUID NOT NULL UNIQUE REFERENCES own_payments/);
  assert.match(schema, /WHERE revoked_at IS NULL/);
});

test("customer product endpoint is authenticated and account page requests it", () => {
  assert.match(server, /GET" && req\.url === "\/v1\/account\/products"[\s\S]*handleMyProducts/);
  assert.match(server, /WHERE e\.user_id=\$1 AND e\.revoked_at IS NULL/);
  assert.match(account, /request\("\/v1\/account\/products"/);
});

test("private workspace requires entitlement and scopes history by user", () => {
  const handler = server.slice(server.indexOf("async function handleCustomerScreenings"), server.indexOf("async function handleMyProducts"));
  assert.match(handler, /hasActiveProduct\(user\.id,"payment-integrity"\)/);
  assert.match(handler, /WHERE user_id=\$1 ORDER BY created_at DESC LIMIT 100/);
  assert.match(server, /\/v1\/account\/payment-integrity\/events/);
  assert.match(schema, /UNIQUE \(user_id,provider_id,event_id\)/);
  assert.match(account, /OPEN YOUR PAYMENT INTEGRITY WORKSPACE/);
});
