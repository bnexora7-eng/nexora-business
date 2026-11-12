import test from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, hashPassword, hashSessionToken, verifyPassword } from "../src/auth.js";

test("password hashes are salted and can be verified", async () => {
  const password = "Correct horse battery staple 2026!";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second, "each password hash must use a fresh salt");
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong password", first), false);
});

test("session tokens are random and stored as one-way hashes", () => {
  const first = createSessionToken();
  const second = createSessionToken();
  assert.notEqual(first, second);
  assert.equal(first.length >= 40, true);
  assert.equal(hashSessionToken(first).length, 64);
  assert.notEqual(hashSessionToken(first), first);
});
