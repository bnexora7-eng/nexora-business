import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:http";
import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { signPayload } from "../src/screening.js";
import { createActionToken, hashActionToken } from "../src/email.js";

const enabled = process.env.RUN_INTEGRATION === "1";
test("HTTP API persists minimized event data and rejects duplicates", { skip: !enabled, timeout: 30000 }, async (t) => {
  const { Pool } = (await import("pg")).default;
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  let firstPaymentStatus = "open";
  let recurringPaymentStatus = "failed";
  let recurringPaymentAmount = { currency: "EUR", value: "29.99" };
  let recurringPaymentCreatedAt = "2026-11-14T10:00:00Z";
  let mollieSubscriptionStatus = "active";
  let mollieSubscriptionIdentityMismatch = false;
  let mollieSubscriptionCreateCount = 0;
  const mollieMock = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    const path = req.url || "";
    let status = 200;
    let data = {};
    if (req.method === "POST" && path === "/v2/customers") {
      data = { id: "cst_nexoratest" };
    } else if (req.method === "POST" && path === "/v2/payments") {
      const input = JSON.parse(body || "{}");
      if (input.sequenceType !== "first" || input.amount?.value !== "29.99") {
        status = 422; data = { title: "Unexpected first payment request" };
      } else {
        data = { id: "tr_nexorafirst", status: firstPaymentStatus, mode: "test", _links: { checkout: { href: "https://checkout.example.test/first" } } };
      }
    } else if (req.method === "GET" && path === "/v2/payments/tr_nexorafirst") {
      data = { resource: "payment", id: "tr_nexorafirst", status: firstPaymentStatus, isCancelable: firstPaymentStatus === "open", amount: { currency: "EUR", value: "29.99" }, metadata: mockFirstPaymentMetadata };
    } else if (req.method === "DELETE" && path === "/v2/payments/tr_nexorafirst") {
      firstPaymentStatus = "canceled";
      data = { resource: "payment", id: "tr_nexorafirst", status: "canceled", amount: { currency: "EUR", value: "29.99" } };
    } else if (req.method === "POST" && path === "/v2/customers/cst_nexoratest/subscriptions") {
      mollieSubscriptionCreateCount += 1;
      const input = JSON.parse(body || "{}");
      if (input.amount?.value !== "29.99" || input.interval !== "1 month") {
        status = 422; data = { title: "Unexpected recurring subscription request" };
      } else {
        data = { id: "sub_nexoratest", status: mollieSubscriptionStatus };
      }
    } else if (req.method === "GET" && path === "/v2/payments/tr_nexorarecurring") {
      data = { resource: "payment", id: "tr_nexorarecurring", status: recurringPaymentStatus, subscriptionId: "sub_nexoratest", amount: recurringPaymentAmount, createdAt: recurringPaymentCreatedAt };
    } else if (req.method === "GET" && path === "/v2/customers/cst_nexoratest/subscriptions/sub_nexoratest") {
      data = { resource: "subscription", id: mollieSubscriptionIdentityMismatch ? "sub_unexpected" : "sub_nexoratest", customerId: "cst_nexoratest", status: mollieSubscriptionStatus, nextPaymentDate: "2099-12-31" };
    } else if (req.method === "DELETE" && path === "/v2/customers/cst_nexoratest/subscriptions/sub_nexoratest") {
      mollieSubscriptionStatus = "canceled";
      data = { resource: "subscription", id: "sub_nexoratest", customerId: "cst_nexoratest", status: "canceled" };
    } else {
      status = 404; data = { title: "Mock Mollie route not found", detail: path };
    }
    res.writeHead(status, { "content-type": "application/json" });
    res.end(JSON.stringify(data));
  });
  let mockFirstPaymentMetadata = {};
  let aiRequestObserved = null;
  let aiRequestCount = 0;
  const aiMock = createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    aiRequestCount++;
    aiRequestObserved = {
      authorization: req.headers.authorization,
      body: JSON.parse(Buffer.concat(chunks).toString("utf8"))
    };
    res.writeHead(200, { "content-type": "application/json" });
    if (aiRequestObserved.body.messages[1].content.includes("business_name: Oversized response test")) {
      res.end(JSON.stringify({ choices: [{ message: { role: "assistant", content: "x".repeat(270 * 1024) } }] }));
      return;
    }
    res.end(JSON.stringify({
      choices: [{ message: { role: "assistant", content: "NEXORA AI TEST PLAN: validate the offer with five target customers." } }]
    }));
  });
  await new Promise(resolve => mollieMock.listen(8082, "127.0.0.1", resolve));
  await new Promise(resolve => aiMock.listen(8083, "127.0.0.1", resolve));
  const port = 8081;
  const secret = "integration-test-secret-please-change";
  const providerId = "integration-provider";
  const child = spawn(process.execPath, ["src/server.js"], {
    cwd: process.cwd(),
    env: { ...process.env, NODE_ENV: "test", SMTP_TEST_MODE: "true", BACKUP_TRIGGER_TOKEN: "integration-backup-trigger-token-for-tests-only", MOLLIE_API_KEY: "test_nexora_integration_key", MOLLIE_API_BASE: "http://127.0.0.1:8082/v2", OPENAI_API_KEY: "test_nexora_ai_key", OPENAI_MODEL: "gpt-4.1-mini", OPENAI_API_URL: "http://127.0.0.1:8083/v1/chat/completions", AI_MONTHLY_TOKEN_LIMIT: "100000", PORT: String(port), PROVIDER_SECRETS: JSON.stringify({ [providerId]: secret }), ENABLE_PUBLIC_DEMO: "true", DEMO_ORIGIN: "https://bnexora7-eng.github.io" },
    stdio: "ignore"
  });
  t.after(async () => {
    child.kill("SIGTERM");
    await new Promise(resolve => mollieMock.close(resolve));
    await new Promise(resolve => aiMock.close(resolve));
    await pool.end();
  });

  // The API process initializes the schema before it reports readiness.
  // Do not run the same DDL concurrently here: parallel CREATE TYPE/enum setup
  // can race and fail with PostgreSQL duplicate pg_type entries.
  let healthy = false;
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) { healthy = true; break; }
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 200));
  }

  assert.equal(healthy, true, "API should start and connect to PostgreSQL");

  const readiness = await fetch(`http://127.0.0.1:${port}/ready`);
  assert.equal(readiness.status, 200, "readiness must confirm PostgreSQL connectivity");
  assert.deepEqual(await readiness.json(), { status: "ready", database: "connected" });

  const jobsBeforePreflight = await pool.query("SELECT COUNT(*)::int AS count FROM backup_jobs");
  const preflightUnauthenticated = await fetch(`http://127.0.0.1:${port}/internal/backup/preflight`);
  assert.equal(preflightUnauthenticated.status, 401, "backup preflight must reject requests without its secret");
  const preflightResponse = await fetch(`http://127.0.0.1:${port}/internal/backup/preflight`, {
    headers: { authorization: "Bearer integration-backup-trigger-token-for-tests-only" }
  });
  assert.equal(preflightResponse.status, 200, "authenticated preflight should report read-only database diagnostics");
  const preflight = await preflightResponse.json();
  assert.equal(typeof preflight.database.name, "string");
  assert.ok(preflight.database.name.length > 0);
  assert.ok(Number.isSafeInteger(preflight.database.size_bytes) && preflight.database.size_bytes > 0);
  assert.ok(Number.isFinite(preflight.database.size_mib) && preflight.database.size_mib > 0);
  assert.equal(typeof preflight.configuration.github_token_configured, "boolean");
  assert.equal(typeof preflight.configuration.repository_configured, "boolean");
  assert.equal(typeof preflight.configuration.encryption_key_configured, "boolean");
  const jobsAfterPreflight = await pool.query("SELECT COUNT(*)::int AS count FROM backup_jobs");
  assert.equal(jobsAfterPreflight.rows[0].count, jobsBeforePreflight.rows[0].count, "preflight must not create a backup job");

  const durableJobId = randomUUID();
  await pool.query("INSERT INTO backup_jobs (id,status,finished_at) VALUES ($1,'succeeded',NOW())", [durableJobId]);
  const durableStatus = await fetch(`http://127.0.0.1:${port}/internal/backup/${durableJobId}`, {
    headers: { authorization: "Bearer integration-backup-trigger-token-for-tests-only" }
  });
  assert.equal(durableStatus.status, 200);
  assert.equal((await durableStatus.json()).status, "succeeded");

  const backupUnauthenticated = await fetch(`http://127.0.0.1:${port}/internal/backup`, { method: "POST" });
  assert.equal(backupUnauthenticated.status, 401, "backup trigger must reject requests without its secret");
  const backupAuthenticatedButUnconfigured = await fetch(`http://127.0.0.1:${port}/internal/backup`, {
    method: "POST",
    headers: { authorization: "Bearer integration-backup-trigger-token-for-tests-only" }
  });
  assert.equal(backupAuthenticatedButUnconfigured.status, 503, "backup trigger must fail closed until destination and encryption secrets exist");
  assert.equal((await backupAuthenticatedButUnconfigured.json()).error, "Backup destination or encryption is not configured");

  assert.equal(readiness.headers.get("x-content-type-options"), "nosniff");
  assert.equal(readiness.headers.get("x-frame-options"), "DENY");
  assert.equal(readiness.headers.get("referrer-policy"), "no-referrer");
  assert.match(readiness.headers.get("content-security-policy") || "", /default-src 'none'/);
  assert.match(readiness.headers.get("strict-transport-security") || "", /max-age=31536000/);

  const accountEmail = "nexora-auth-" + Date.now() + "@example.invalid";
  const accountPassword = "NEXORA-test-password-2026!";
  const register = await fetch(`http://127.0.0.1:${port}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accountEmail, password: accountPassword })
  });
  assert.equal(register.status, 201);
  const registered = await register.json();
  assert.equal(registered.status, "verification_required");
  assert.equal(registered.email, accountEmail);
  assert.equal("token" in registered, false);

  const unverifiedLogin = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accountEmail, password: accountPassword })
  });
  assert.equal(unverifiedLogin.status, 403);
  assert.equal((await unverifiedLogin.json()).code, "email_not_verified");

  // Exercise the real one-use verification endpoint without depending on an inbox.
  const verificationToken = createActionToken();
  await pool.query(
    "INSERT INTO email_action_tokens (user_id,token_hash,purpose,expires_at) SELECT id,$1,'verify_email',NOW()+INTERVAL '24 hours' FROM app_users WHERE email=$2",
    [hashActionToken(verificationToken),accountEmail]
  );
  const verifyEmail = await fetch(`http://127.0.0.1:${port}/v1/auth/verify-email`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: verificationToken })
  });
  assert.equal(verifyEmail.status, 200);
  assert.equal((await verifyEmail.json()).status, "email_verified");
  const reusedVerification = await fetch(`http://127.0.0.1:${port}/v1/auth/verify-email`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: verificationToken })
  });
  assert.equal(reusedVerification.status, 400, "verification links must be single-use");
  const verifiedAccount = await pool.query(
    "SELECT id,email FROM app_users WHERE email=$1 AND email_verified_at IS NOT NULL",
    [accountEmail]
  );
  assert.equal(verifiedAccount.rowCount, 1);
  const accountId = verifiedAccount.rows[0].id;

  const login = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accountEmail, password: accountPassword })
  });
  assert.equal(login.status, 200);
  const loggedIn = await login.json();
  assert.equal(typeof loggedIn.token, "string");
  assert.equal(loggedIn.token.length >= 40, true);

  const profile = await fetch(`http://127.0.0.1:${port}/v1/auth/me`, {
    headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(profile.status, 200);
  assert.equal((await profile.json()).user.email, accountEmail);

  // Password-reset tokens are single-use, expire, and revoke existing sessions.
  const resetToken = createActionToken();
  await pool.query(
    "INSERT INTO email_action_tokens (user_id,token_hash,purpose,expires_at) VALUES ($1,$2,'reset_password',NOW()+INTERVAL '1 hour')",
    [accountId, hashActionToken(resetToken)]
  );
  const resetResponse = await fetch(`http://127.0.0.1:${port}/v1/auth/reset-password`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: "NEXORA-new-password-2026!" })
  });
  assert.equal(resetResponse.status, 200);
  assert.equal((await resetResponse.json()).status, "password_reset");
  const reusedResetToken = await fetch(`http://127.0.0.1:${port}/v1/auth/reset-password`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ token: resetToken, password: "NEXORA-another-password-2026!" })
  });
  assert.equal(reusedResetToken.status, 400);
  const revokedProfile = await fetch(`http://127.0.0.1:${port}/v1/auth/me`, {
    headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(revokedProfile.status, 401);
  const newLogin = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accountEmail, password: "NEXORA-new-password-2026!" })
  });
  assert.equal(newLogin.status, 200);
  const newSessionToken = (await newLogin.json()).token;
  loggedIn.token = newSessionToken;

  // The profile endpoint must enforce the same verified-email guard as all
  // other authenticated endpoints, including for sessions issued earlier.
  await pool.query("UPDATE app_users SET email_verified_at=NULL WHERE id=$1", [accountId]);
  const unverifiedProfile = await fetch(`http://127.0.0.1:${port}/v1/auth/me`, {
    headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(unverifiedProfile.status, 401);
  await pool.query("UPDATE app_users SET email_verified_at=NOW() WHERE id=$1", [accountId]);

  const duplicateAccount = await fetch(`http://127.0.0.1:${port}/v1/auth/register`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accountEmail, password: accountPassword })
  });
  assert.equal(duplicateAccount.status, 409);

  const badLogin = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: accountEmail, password: "incorrect-password" })
  });
  assert.equal(badLogin.status, 401);

  const throttledIP = "198.51.100.77";
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json", "cf-connecting-ip": throttledIP, "x-forwarded-for": "198.51.100.10" },
      body: JSON.stringify({ email: "rate-limit@example.invalid", password: "incorrect-password" })
    });
    assert.equal(response.status, 401, `auth attempt ${attempt + 1} should be allowed`);
  }
  const blockedAttempt = await fetch(`http://127.0.0.1:${port}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json", "cf-connecting-ip": throttledIP, "x-forwarded-for": "198.51.100.11" },
    body: JSON.stringify({ email: "rate-limit@example.invalid", password: "incorrect-password" })
  });
  assert.equal(blockedAttempt.status, 429, "the 11th auth attempt in 15 minutes must be blocked");
  const ipHash = createHash("sha256").update(throttledIP).digest("hex");
  const durableLimit = await pool.query("SELECT attempt_count FROM auth_rate_limits WHERE ip_hash=$1", [ipHash]);
  assert.equal(Number(durableLimit.rows[0].attempt_count), 11, "auth attempt count must persist in PostgreSQL");

  const lockedFeature = await fetch(`http://127.0.0.1:${port}/v1/community/posts`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ body: "verified accounts can publish without a subscription" })
  });
  assert.equal(lockedFeature.status, 201);


  const lockedMarketplace = await fetch(`http://127.0.0.1:${port}/v1/marketplace/listings`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ title: "Free-mode listing", description: "A verified account can publish without a subscription.", category: "service", price: "1.00" })
  });
  assert.equal(lockedMarketplace.status, 201);

  const lockedWorkspace = await fetch(`http://127.0.0.1:${port}/v1/business/workspace`, {
    headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(lockedWorkspace.status, 200);

  // Temporary free-access mode ignores subscription state, including expired legacy states.
  await pool.query(
    "UPDATE app_users SET subscription_status='canceled',subscription_access_until=NOW() + INTERVAL '1 day' WHERE id=$1",
    [accountId]
  );
  const retainedAccess = await fetch(`http://127.0.0.1:${port}/v1/community/posts`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ body: "account access remains after legacy cancellation" })
  });
  assert.equal(retainedAccess.status, 201);
  await pool.query(
    "UPDATE app_users SET subscription_access_until=NOW() - INTERVAL '1 second' WHERE id=$1",
    [accountId]
  );
  const expiredAccess = await fetch(`http://127.0.0.1:${port}/v1/community/posts`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ body: "expired legacy membership must not block account access" })
  });
  assert.equal(expiredAccess.status, 201);

  // No paid membership is required in temporary free-access mode.
  await pool.query("UPDATE app_users SET subscription_status='active',subscription_access_until=NULL WHERE id=$1",[accountId]);

  // Verify the paid Business Studio AI route calls only the configured server-side provider.
  const aiPlanResponse = await fetch("http://127.0.0.1:" + port + "/v1/business/ai-plan", {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ business_name: "NEXORA Test", industry: "software", problem: "Small firms need simple automation", offer: "AI business planning", budget: "100 EUR", duration_days: "30" })
  });
  assert.equal(aiPlanResponse.status, 200);
  const aiPlanBody = await aiPlanResponse.json();
  assert.match(aiPlanBody.plan, /NEXORA AI TEST PLAN/);
  assert.equal(aiPlanBody.model, "gpt-4.1-mini");
  assert.equal(aiRequestObserved.authorization, "Bearer test_nexora_ai_key");
  assert.equal(aiRequestObserved.body.model, "gpt-4.1-mini");
  assert.equal(aiRequestObserved.body.max_tokens, 1400);
  assert.match(aiRequestObserved.body.messages[1].content, /Small firms need simple automation/);
  const reservedAIUsage = await pool.query("SELECT reserved_tokens FROM ai_monthly_usage WHERE period_start=date_trunc('month', NOW() AT TIME ZONE 'UTC')::date");
  const observedInputBytes = Buffer.byteLength(aiRequestObserved.body.messages[0].content, "utf8") + Buffer.byteLength(aiRequestObserved.body.messages[1].content, "utf8");
  assert.ok(Number(reservedAIUsage.rows[0].reserved_tokens) >= observedInputBytes + 1400, "AI budget reservation must cover UTF-8 input bytes and maximum output tokens");

  // Oversized provider responses must be rejected without unbounded buffering.
  const oversizedAI = await fetch("http://127.0.0.1:" + port + "/v1/business/ai-plan", {
    method: "POST", headers: { Authorization: "Bearer " + newSessionToken, "Content-Type": "application/json" },
    body: JSON.stringify({ business_name: "Oversized response test", industry: "software", problem: "Test response limits", offer: "Bounded output" })
  });
  assert.equal(oversizedAI.status, 502);
  assert.match((await oversizedAI.json()).error, /exceeded the allowed size/i);

  // Four valid AI requests per account per minute are allowed; the fifth is rejected before provider usage.
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch("http://127.0.0.1:" + port + "/v1/business/ai-plan", {
      method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
      body: JSON.stringify({ industry: "software", problem: "rate limit test" })
    });
    assert.equal(response.status, 200);
  }
  const providerCallsAtLimit = aiRequestCount;
  const rateLimitedAI = await fetch("http://127.0.0.1:" + port + "/v1/business/ai-plan", {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ industry: "software", problem: "fifth request" })
  });
  assert.equal(rateLimitedAI.status, 429);
  assert.equal(aiRequestCount, providerCallsAtLimit, "rate-limited requests must not reach the AI provider");

  await pool.query("UPDATE ai_monthly_usage SET reserved_tokens=99999 WHERE period_start=date_trunc('month', NOW() AT TIME ZONE 'UTC')::date");
  const callsBeforeBudgetCheck = aiRequestCount;
  const monthlyLimitedAI = await fetch("http://127.0.0.1:" + port + "/v1/business/ai-plan", {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + newSessionToken },
    body: JSON.stringify({ industry: "software", problem: "Monthly budget check" })
  });
  assert.equal(monthlyLimitedAI.status, 429);
  assert.match((await monthlyLimitedAI.json()).error, /monthly AI usage budget/i);
  assert.equal(aiRequestCount, callsBeforeBudgetCheck, "monthly quota must block calls before provider usage");


  // Exercise the member workspace, community and marketplace API used by the published UI.
  const workspaceSave = await fetch("http://127.0.0.1:" + port + "/v1/business/workspace", {
    method: "PUT", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ business_name: "NEXORA Test Studio", tagline: "A test workspace", goals: "Validate member workspace persistence" })
  });
  assert.equal(workspaceSave.status, 200);
  const workspaceRead = await fetch("http://127.0.0.1:" + port + "/v1/business/workspace", {
    headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(workspaceRead.status, 200);
  const workspaceBody = await workspaceRead.json();
  assert.equal(workspaceBody.workspace.business_name, "NEXORA Test Studio");
  assert.equal(workspaceBody.workspace.tagline, "A test workspace");
  assert.equal(workspaceBody.workspace.goals, "Validate member workspace persistence");

  const marketplaceCreate = await fetch("http://127.0.0.1:" + port + "/v1/marketplace/listings", {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ title: "NEXORA test service", description: "A listing used to verify the member marketplace API.", category: "service", price: "19.99" })
  });
  assert.equal(marketplaceCreate.status, 201);
  const createdListing = (await marketplaceCreate.json()).listing;
  assert.equal(createdListing.title, "NEXORA test service");
  assert.equal(Number(createdListing.price), 19.99);
  const marketplaceRead = await fetch("http://127.0.0.1:" + port + "/v1/marketplace/listings");
  assert.equal(marketplaceRead.status, 200);
  assert.ok((await marketplaceRead.json()).listings.some(item => item.id === createdListing.id));

  const communityRead = await fetch("http://127.0.0.1:" + port + "/v1/community/posts");
  assert.equal(communityRead.status, 200);
  assert.ok(Array.isArray((await communityRead.json()).posts));

  // Monthly membership is disabled: a signed-in account must never start a subscription checkout.
  const disabledCheckout = await fetch(`http://127.0.0.1:${port}/v1/subscriptions/checkout`, {
    method: "POST", headers: { authorization: "Bearer " + loggedIn.token, "content-type": "application/json" },
    body: JSON.stringify({})
  });
  assert.equal(disabledCheckout.status, 410);
  const disabledCheckoutBody = await disabledCheckout.json();
  assert.equal(disabledCheckoutBody.code, "subscription_disabled");
  const noSubscriptionOrders = await pool.query(
    "SELECT COUNT(*)::int AS count FROM own_payments WHERE user_id=$1 AND description='NEXORA All Access monthly subscription'",
    [accountId]
  );
  assert.equal(noSubscriptionOrders.rows[0].count, 0, "monthly membership must not create payment orders");

  // Create user-owned content, then verify account deletion removes it.
  const createPost = await fetch(`http://127.0.0.1:${port}/v1/community/posts`, {
    method: "POST", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ body: "delete me with my account" })
  });
  assert.equal(createPost.status, 201);
  const createWorkspace = await fetch(`http://127.0.0.1:${port}/v1/business/workspace`, {
    method: "PUT", headers: { "content-type": "application/json", authorization: "Bearer " + loggedIn.token },
    body: JSON.stringify({ business_name: "Delete test", tagline: "", goals: "private notes" })
  });
  assert.equal(createWorkspace.status, 200);
  const paymentOrderId = randomUUID();
  await pool.query("INSERT INTO own_payments (order_id,user_id,amount,description,status) VALUES ($1,$2,25.00,$3,$4)", [paymentOrderId, accountId, "Integration test payment", "paid"]);
  await pool.query(
    "INSERT INTO marketplace_listings (user_id,title,description,category,price) VALUES ($1,'Delete listing','Private test listing','service',10.00)",
    [accountId]
  );
  await pool.query("INSERT INTO ai_usage_windows (user_id,request_count) VALUES ($1,1) ON CONFLICT (user_id) DO NOTHING", [accountId]);
  // There is no monthly subscription to cancel; account deletion removes the account and its data.
  await pool.query("UPDATE app_users SET subscription_status='inactive',mollie_customer_id=NULL,mollie_subscription_id=NULL,subscription_access_until=NULL WHERE id=$1",[accountId]);
  const deleteResponse = await fetch(`http://127.0.0.1:${port}/v1/auth/account`, {
    method: "DELETE", headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(deleteResponse.status, 200);
  assert.equal((await deleteResponse.json()).status, "account_deleted");
  const deletedProfile = await fetch(`http://127.0.0.1:${port}/v1/auth/me`, {
    headers: { authorization: "Bearer " + loggedIn.token }
  });
  assert.equal(deletedProfile.status, 401);
  const deletedRows = await pool.query(
    `SELECT
      (SELECT COUNT(*) FROM app_users WHERE email=$1)::int AS users,
      (SELECT COUNT(*) FROM app_sessions WHERE user_id=$2)::int AS sessions,
      (SELECT COUNT(*) FROM email_action_tokens WHERE user_id=$2)::int AS action_tokens,
      (SELECT COUNT(*) FROM community_posts WHERE user_id=$2)::int AS posts,
      (SELECT COUNT(*) FROM marketplace_listings WHERE user_id=$2)::int AS listings,
      (SELECT COUNT(*) FROM business_workspaces WHERE user_id=$2)::int AS workspaces,
      (SELECT COUNT(*) FROM ai_usage_windows WHERE user_id=$2)::int AS ai_usage`,
    [accountEmail, accountId]
  );
  assert.deepEqual(deletedRows.rows[0], {
    users: 0, sessions: 0, action_tokens: 0, posts: 0, listings: 0, workspaces: 0, ai_usage: 0
  });
  const retainedPayment = await pool.query("SELECT user_id FROM own_payments WHERE order_id=$1", [paymentOrderId]);
  assert.equal(retainedPayment.rowCount, 1);
  assert.equal(retainedPayment.rows[0].user_id, null);

  const accountDeletePreflight = await fetch(`http://127.0.0.1:${port}/v1/auth/account`, {
    method: "OPTIONS",
    headers: {
      origin: "https://bnexora7-eng.github.io",
      "access-control-request-method": "DELETE",
      "access-control-request-headers": "authorization"
    }
  });
  assert.equal(accountDeletePreflight.status, 204);
  assert.equal(accountDeletePreflight.headers.get("access-control-allow-origin"), "https://bnexora7-eng.github.io");
  assert.ok((accountDeletePreflight.headers.get("access-control-allow-methods") || "").split(",").map(method => method.trim()).includes("DELETE"));
  assert.match(accountDeletePreflight.headers.get("access-control-allow-headers") || "", /authorization/i);

  const webDeleteEmail = "nexora-web-delete-" + Date.now() + "@example.invalid";
  const webDeleteRegister = await fetch(`http://127.0.0.1:${port}/v1/auth/register`, {
    method: "POST", headers: { "content-type": "application/json", "cf-connecting-ip": "198.51.100.31" },
    body: JSON.stringify({ email: webDeleteEmail, password: accountPassword })
  });
  assert.equal(webDeleteRegister.status, 201);
  const webDeleteWrongPassword = await fetch(`http://127.0.0.1:${port}/v1/auth/delete-request`, {
    method: "POST", headers: { "content-type": "application/json", origin: "https://bnexora7-eng.github.io", "cf-connecting-ip": "198.51.100.31" },
    body: JSON.stringify({ email: webDeleteEmail, password: "wrong-password" })
  });
  assert.equal(webDeleteWrongPassword.status, 401);
  const webAccountBeforeDelete = await pool.query("SELECT id FROM app_users WHERE email=$1", [webDeleteEmail]);
  assert.equal(webAccountBeforeDelete.rowCount, 1);

  const webDelete = await fetch(`http://127.0.0.1:${port}/v1/auth/delete-request`, {
    method: "POST", headers: { "content-type": "application/json", origin: "https://bnexora7-eng.github.io", "cf-connecting-ip": "198.51.100.31" },
    body: JSON.stringify({ email: webDeleteEmail, password: accountPassword })
  });
  assert.equal(webDelete.status, 200);
  assert.equal(webDelete.headers.get("access-control-allow-origin"), "https://bnexora7-eng.github.io");
  const webDeletedUser = await pool.query("SELECT id FROM app_users WHERE email=$1", [webDeleteEmail]);
  assert.equal(webDeletedUser.rowCount, 0);

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

  // Changing caller-controlled X-Forwarded-For must not bypass the demo rate limit
  // when Cloudflare supplies the same trusted CF-Connecting-IP value.
  const demoRateLimitIP = "198.51.100.88";
  for (let attempt = 0; attempt < 20; attempt++) {
    const response = await fetch(`http://127.0.0.1:${port}/v1/demo/events`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: "https://bnexora7-eng.github.io",
        "cf-connecting-ip": demoRateLimitIP,
        "x-forwarded-for": "203.0.113." + (attempt + 1)
      },
      body: JSON.stringify({ ...demoEvent, event_id: "evt-demo-limit-" + attempt })
    });
    assert.equal(response.status, 200, `demo request ${attempt + 1} should be allowed`);
  }
  const blockedDemoAttempt = await fetch(`http://127.0.0.1:${port}/v1/demo/events`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://bnexora7-eng.github.io",
      "cf-connecting-ip": demoRateLimitIP,
      "x-forwarded-for": "203.0.113.250"
    },
    body: JSON.stringify({ ...demoEvent, event_id: "evt-demo-limit-blocked" })
  });
  assert.equal(blockedDemoAttempt.status, 429, "changing the spoofed X-Forwarded-For must not bypass the demo rate limit");

  const counts = await pool.query(
    "SELECT COUNT(*)::int AS events FROM screened_events WHERE provider_id=$1 AND event_id IN ($2,$3)",
    [providerId, "evt-integration-001", "evt-integration-002"]
  );
  assert.equal(counts.rows[0].events, 2);
  await pool.query("DELETE FROM app_users WHERE email=$1", [accountEmail]);
  await pool.query("DELETE FROM screening_audit WHERE provider_id=$1", [providerId]);
  await pool.query("DELETE FROM screened_events WHERE provider_id=$1", [providerId]);
});