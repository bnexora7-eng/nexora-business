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
    const verificationMessage = verification.message.toString("utf8").replace(/=\r?\n/g, "").replace(/=3D/g, "=");
    assert.match(verificationMessage, /Confirm your NEXORA email address/);
    assert.match(verificationMessage, /https:\/\/example\.test\/account\/verify\.html\?token=verification-token-123/);

    const reset = await sendPasswordResetEmail("member@example.test", "reset-token-456");
    const resetMessage = reset.message.toString("utf8").replace(/=\r?\n/g, "").replace(/=3D/g, "=");
    assert.match(resetMessage, /Reset your NEXORA password/);
    assert.match(resetMessage, /https:\/\/example\.test\/account\/reset-password\.html\?token=reset-token-456/);
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.smtpTestMode === undefined) delete process.env.SMTP_TEST_MODE; else process.env.SMTP_TEST_MODE = previous.smtpTestMode;
    if (previous.accountUrl === undefined) delete process.env.NEXORA_ACCOUNT_URL; else process.env.NEXORA_ACCOUNT_URL = previous.accountUrl;
  }
});


test("Brevo HTTPS delivery uses the verified sender and never exposes its API key", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    brevoKey: process.env.BREVO_API_KEY,
    brevoFrom: process.env.BREVO_FROM,
    smtpUser: process.env.SMTP_USER,
    smtpPassword: process.env.SMTP_APP_PASSWORD,
    fetch: globalThis.fetch
  };
  const calls = [];
  process.env.NODE_ENV = "production";
  process.env.BREVO_API_KEY = "unit-test-brevo-key";
  process.env.BREVO_FROM = "verified@nexora.example";
  delete process.env.SMTP_USER;
  delete process.env.SMTP_APP_PASSWORD;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return new Response(JSON.stringify({ messageId: "brevo-test-message-id" }), {
      status: 201, headers: { "content-type": "application/json" }
    });
  };
  try {
    const { sendVerificationEmail } = await import("../src/email.js");
    const result = await sendVerificationEmail("member@example.test", "brevo-verification-token-12345678901234567890");
    assert.equal(result.messageId, "brevo-test-message-id");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.brevo.com/v3/smtp/email");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.headers["api-key"], "unit-test-brevo-key");
    assert.equal(calls[0].body.sender.email, "verified@nexora.example");
    assert.equal(calls[0].body.to[0].email, "member@example.test");
    assert.match(calls[0].body.htmlContent, /verify\.html\?token=/);
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.brevoKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = previous.brevoKey;
    if (previous.brevoFrom === undefined) delete process.env.BREVO_FROM; else process.env.BREVO_FROM = previous.brevoFrom;
    if (previous.smtpUser === undefined) delete process.env.SMTP_USER; else process.env.SMTP_USER = previous.smtpUser;
    if (previous.smtpPassword === undefined) delete process.env.SMTP_APP_PASSWORD; else process.env.SMTP_APP_PASSWORD = previous.smtpPassword;
    globalThis.fetch = previous.fetch;
  }
});

test("Brevo delivery failures are surfaced without leaking provider response details", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    brevoKey: process.env.BREVO_API_KEY,
    brevoFrom: process.env.BREVO_FROM,
    fetch: globalThis.fetch
  };
  process.env.NODE_ENV = "production";
  process.env.BREVO_API_KEY = "unit-test-brevo-key";
  process.env.BREVO_FROM = "verified@nexora.example";
  globalThis.fetch = async () => new Response(JSON.stringify({
    code: "sender_not_allowed", message: "Private provider detail"
  }), { status: 400, headers: { "content-type": "application/json" } });
  try {
    const { sendPasswordResetEmail } = await import("../src/email.js");
    await assert.rejects(
      () => sendPasswordResetEmail("member@example.test", "brevo-reset-token-12345678901234567890"),
      error => error.statusCode === 502 && /HTTP 400/.test(error.message) && !/Private provider detail/.test(error.message)
    );
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.brevoKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = previous.brevoKey;
    if (previous.brevoFrom === undefined) delete process.env.BREVO_FROM; else process.env.BREVO_FROM = previous.brevoFrom;
    globalThis.fetch = previous.fetch;
  }
});
