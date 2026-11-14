import test from "node:test";
import assert from "node:assert/strict";
import { createActionToken, hashActionToken } from "../src/email.js";

test("account action tokens are high entropy and stored as one-way hashes", () => {
  const first = createActionToken();
  const second = createActionToken();
  assert.notEqual(first, second);
  assert.equal(first.length >= 40, true);
  assert.equal(hashActionToken(first).length, 64);
  assert.notEqual(hashActionToken(first), first);
});

test("action token hashes are deterministic for database lookup", () => {
  const token = createActionToken();
  assert.equal(hashActionToken(token), hashActionToken(token));
  assert.notEqual(hashActionToken(token), hashActionToken(createActionToken()));
});
