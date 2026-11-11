import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import pg from "pg";
import { signPayload } from "../src/screening.js";

const enabled = process.env.RUN_INTEGRATION === "1";
test("HTTP API persists minimized event data and rejects duplicates", { skip: !enabled, timeout: 30000 }, async (t) => {
  const { Pool } = pg;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const port = 8081;
  const secret = "integration-test-secret-please-change";
  const providerId = "integration-provider";
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: String(port), PROVIDER_SECRETS: JSON.stringify({ [providerId]: secret }), ENABLE_PUBLIC_DEMO: "true", DEMO_ORIGIN: "https://bnexora7-eng.github.io" },
    stdio: "ignore"
  });
  t.after(async () => {
    child.kill("SIGTERM");
    await pool.end();
  });

  await pool.query(await readFile(new URL("../src/schema.sql", import.meta.url), "utf8"));
  let healthy = false;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) { healthy = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  assert.equal(healthy, true, "API should start and connect to PostgreSQL");

  async function submit(event, tamper = false) {
    const rawBody = Buffer.from(JSON.stringify(event));
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = signPayload(rawBody, timestamp, secret);
    return fetch(`http://127.0.0.1:${port}/v1/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-nexora-timestamp": timestamp,
        "x-nexora-signature": tamper ? "sha256=" + "0".repeat(64) : signature
      },
      body: rawBody
    });
  }

  const unique = {
    provider_id: providerId,
    event_id: "evt-integration-001",
    amount: 125,
    currency: "EUR",
    status: "SUCCESS",
    customer_email: "must-not-be-stored@example.invalid"
  };
  const first = await submit(unique);
  assert.equal(first.status, 200);
  assert.equal((await first.json()).decision, "ACCEPT");

  const stored = await pool.query(
    "SELECT payload FROM screened_events WHERE provider_id=$1 AND event_id=$2",
    [providerId, unique.event_id]
  );
  assert.deepEqual(stored.rows[0].payload, {
    provider_id: providerId,
    event_id: unique.event_id,
    amount: 125,
    currency: "EUR",
    status: "SUCCESS"
  }, "database payload must exclude arbitrary customer/provider metadata");

  const duplicate = await submit(unique);
  assert.equal(duplicate.status, 200);
  const duplicateBody = await duplicate.json();
  assert.equal(duplicateBody.decision, "REJECT");
  assert.equal(duplicateBody.duplicate, true);

  const pending = await submit({ ...unique, event_id: "evt-integration-002", status: "PENDING" });
  assert.equal((await pending.json()).decision, "REVIEW");

  const badSignature = await submit({ ...unique, event_id: "evt-integration-003" }, true);
  assert.equal(badSignature.status, 401);

  const demoEvent = { event_id: "evt-public-demo-001", amount: 40, currency: "EUR", status: "succeeded" };
  const demoFirst = await fetch(`http://127.0.0.1:${port}/v1/demo/events`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://bnexora7-eng.github.io" },
    body: JSON.stringify(demoEvent)
  });
  assert.equal(demoFirst.status, 200);
  assert.equal(demoFirst.headers.get("access-control-allow-origin"), "https://bnexora7-eng.github.io");
  assert.equal((await demoFirst.json()).decision, "ACCEPT");

  const demoDuplicate = await fetch(`http://127.0.0.1:${port}/v1/demo/events`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://bnexora7-eng.github.io" },
    body: JSON.stringify(demoEvent)
  });
  const demoDuplicateBody = await demoDuplicate.json();
  assert.equal(demoDuplicateBody.decision, "REJECT");
  assert.equal(demoDuplicateBody.duplicate, true);

  const blockedOrigin = await fetch(`http://127.0.0.1:${port}/v1/demo/events`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ ...demoEvent, event_id: "evt-blocked-origin" })
  });
  assert.equal(blockedOrigin.status, 403);

  const counts = await pool.query(
    "SELECT COUNT(*)::int AS events FROM screened_events WHERE provider_id=$1 AND event_id IN ($2,$3)",
    [providerId, "evt-integration-001", "evt-integration-002"]
  );
  assert.equal(counts.rows[0].events, 2);
  await pool.query("DELETE FROM screening_audit WHERE provider_id=$1", [providerId]);
  await pool.query("DELETE FROM screened_events WHERE provider_id=$1", [providerId]);
});