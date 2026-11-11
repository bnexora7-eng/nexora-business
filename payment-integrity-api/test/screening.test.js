import test from "node:test";
import assert from "node:assert/strict";
import { screenEvent, signPayload, verifySignature } from "../src/screening.js";
const event = { provider_id: "demo-provider", event_id: "evt-1", amount: 950, currency: "EUR", status: "SUCCESS" };

test("successful event is accepted", () => assert.equal(screenEvent(event).decision, "ACCEPT"));
test("pending event requires review", () => assert.equal(screenEvent({ ...event, status: "PENDING" }).decision, "REVIEW"));
test("failed event is rejected", () => assert.equal(screenEvent({ ...event, status: "FAILED" }).decision, "REJECT"));
test("threshold amount requires review", () => assert.equal(screenEvent({ ...event, amount: 10000 }).decision, "REVIEW"));
test("zero amount is rejected", () => assert.equal(screenEvent({ ...event, amount: 0 }).decision, "REJECT"));
test("HMAC validates and detects tampering", () => {
  const rawBody = Buffer.from(JSON.stringify(event));
  const timestamp = String(Math.floor(Date.now() / 1000));
  const signature = signPayload(rawBody, timestamp, "test-secret");
  assert.equal(verifySignature({ rawBody, timestamp, signature, secret: "test-secret" }), true);
  assert.equal(verifySignature({ rawBody: Buffer.from("tampered"), timestamp, signature, secret: "test-secret" }), false);
});
test("expired signature is rejected", () => {
  const rawBody = Buffer.from(JSON.stringify(event));
  const timestamp = String(Math.floor(Date.now() / 1000) - 600);
  const signature = signPayload(rawBody, timestamp, "test-secret");
  assert.equal(verifySignature({ rawBody, timestamp, signature, secret: "test-secret" }), false);
});