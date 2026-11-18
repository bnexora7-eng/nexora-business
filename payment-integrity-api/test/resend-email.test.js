import test from "node:test";
import assert from "node:assert/strict";

test("Resend HTTPS delivery sends ALPINOSS verification email through the configured sender", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    resendKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM,
    allowTestSender: process.env.RESEND_ALLOW_TEST_SENDER,
    brevoKey: process.env.BREVO_API_KEY,
    brevoFrom: process.env.BREVO_FROM,
    fetch: globalThis.fetch
  };
  const calls = [];
  process.env.NODE_ENV = "production";
  process.env.RESEND_API_KEY = "unit-test-resend-key";
  process.env.RESEND_FROM = "ALPINOSS <mail@example.test>";
  delete process.env.RESEND_ALLOW_TEST_SENDER;
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_FROM;
  globalThis.fetch = async (url, options) => {
    calls.push({ url, options, body: JSON.parse(options.body) });
    return new Response(JSON.stringify({ id: "resend-test-message-id" }), {
      status: 200, headers: { "content-type": "application/json" }
    });
  };
  try {
    const { sendVerificationEmail } = await import("../src/email.js");
    const result = await sendVerificationEmail("member@example.test", "resend-verification-token-12345678901234567890");
    assert.equal(result.messageId, "resend-test-message-id");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://api.resend.com/emails");
    assert.equal(calls[0].options.method, "POST");
    assert.equal(calls[0].options.headers.Authorization, "Bearer unit-test-resend-key");
    assert.equal(calls[0].body.from, "ALPINOSS <mail@example.test>");
    assert.deepEqual(calls[0].body.to, ["member@example.test"]);
    assert.match(calls[0].body.html, /verify\.html\?token=/);
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.resendKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous.resendKey;
    if (previous.resendFrom === undefined) delete process.env.RESEND_FROM; else process.env.RESEND_FROM = previous.resendFrom;
    if (previous.allowTestSender === undefined) delete process.env.RESEND_ALLOW_TEST_SENDER; else process.env.RESEND_ALLOW_TEST_SENDER = previous.allowTestSender;
    if (previous.brevoKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = previous.brevoKey;
    if (previous.brevoFrom === undefined) delete process.env.BREVO_FROM; else process.env.BREVO_FROM = previous.brevoFrom;
    globalThis.fetch = previous.fetch;
  }
});

test("Resend refuses the test sender for live account mail unless explicitly enabled", async () => {
  const previous = {
    nodeEnv: process.env.NODE_ENV,
    resendKey: process.env.RESEND_API_KEY,
    resendFrom: process.env.RESEND_FROM,
    allowTestSender: process.env.RESEND_ALLOW_TEST_SENDER,
    brevoKey: process.env.BREVO_API_KEY,
    brevoFrom: process.env.BREVO_FROM
  };
  process.env.NODE_ENV = "production";
  process.env.RESEND_API_KEY = "unit-test-resend-key";
  process.env.RESEND_FROM = "onboarding@resend.dev";
  delete process.env.RESEND_ALLOW_TEST_SENDER;
  delete process.env.BREVO_API_KEY;
  delete process.env.BREVO_FROM;
  try {
    const { sendPasswordResetEmail } = await import("../src/email.js");
    await assert.rejects(
      () => sendPasswordResetEmail("member@example.test", "resend-reset-token-12345678901234567890"),
      error => error.statusCode === 503 && /verified domain/.test(error.message)
    );
  } finally {
    if (previous.nodeEnv === undefined) delete process.env.NODE_ENV; else process.env.NODE_ENV = previous.nodeEnv;
    if (previous.resendKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previous.resendKey;
    if (previous.resendFrom === undefined) delete process.env.RESEND_FROM; else process.env.RESEND_FROM = previous.resendFrom;
    if (previous.allowTestSender === undefined) delete process.env.RESEND_ALLOW_TEST_SENDER; else process.env.RESEND_ALLOW_TEST_SENDER = previous.allowTestSender;
    if (previous.brevoKey === undefined) delete process.env.BREVO_API_KEY; else process.env.BREVO_API_KEY = previous.brevoKey;
    if (previous.brevoFrom === undefined) delete process.env.BREVO_FROM; else process.env.BREVO_FROM = previous.brevoFrom;
  }
});
