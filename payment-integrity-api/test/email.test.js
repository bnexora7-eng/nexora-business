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


test("verification and password-reset emails render correct account links in test transport", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    smtpTestMode: process.env.SMTP_TEST_MODE,
    accountUrl: process.env.NEXORA_ACCOUNT_URL
  };
  process.env.NODE_ENV = "test";
  process.env.SMTP_TEST_MODE = "true";
  process.env.NEXORA_ACCOUNT_URL = "https://example.test/account";
  try {
    const { sendVerificationEmail, sendPasswordResetEmail } = await import("../src/email.js");
    const verification = await sendVerificationEmail("member@example.test", "verification-token-123");
    const verificationMessage = verification.message.toString("utf8");
    assert.match(verificationMessage, /Confirm your NEXORA email address/);
    assert.match(verificationMessage, /https:\/\/example\.test\/account\/verify\.html\?token=verification-token-123/);

    const reset = await sendPasswordResetEmail("member@example.test", "reset-token-456");
    const resetMessage = reset.message.toString("utf8");
    assert.match(resetMessage, /Reset your NEXORA password/);
    assert.match(resetMessage, /https:\/\/example\.test\/account\/reset-password\.html\?token=reset-token-456/);
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.smtpTestMode === undefined) delete process.env.SMTP_TEST_MODE; else process.env.SMTP_TEST_MODE = previous.smtpTestMode;
    if (previous.accountUrl === undefined) delete process.env.NEXORA_ACCOUNT_URL; else process.env.NEXORA_ACCOUNT_URL = previous.accountUrl;
  }
});
