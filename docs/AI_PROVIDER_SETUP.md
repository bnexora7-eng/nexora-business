# NEXORA Business Studio — AI provider setup

**Current state:** the Business Studio AI route is implemented, but live generation remains disabled until a server-side provider key is configured.

## Architecture

- The browser sends business-planning fields to `POST /v1/business/ai-plan`.
- The API requires a verified, signed-in account with active NEXORA All Access (or access remaining in an already-paid canceled period).
- The API sends the request to the OpenAI Chat Completions endpoint. The default model is `gpt-4.1-mini`.
- The API key is read only from `OPENAI_API_KEY` in the Render service environment. It is never sent to the browser or stored in Git.
- The endpoint has a 25-second timeout, a per-account request limit, field-size limits and a hard 256 KiB cap on the provider's JSON response body.

## Required configuration — when the owner approves API spending

1. Create or use an OpenAI API Platform account. ChatGPT subscriptions do not include API credits; API usage is billed separately.
2. Create a restricted API key for the NEXORA server. Do not paste the key into GitHub, source files, this chat, or the mobile app.
3. In Render, open the `nexora-payment-integrity-api` service and its Environment page.
4. Add `OPENAI_API_KEY` as a secret value. Keep `OPENAI_MODEL` set to `gpt-4.1-mini`; `OPENAI_API_URL` can remain unset because the official endpoint is the default.
5. Save and deploy the environment change. Do not enable live use until the deployment is healthy.
6. Sign in with a verified test account that has All Access, generate a short test plan, and verify the result in Business Studio. Confirm the provider usage dashboard records the request.
7. Set a low API usage budget/alert in the OpenAI Platform before allowing member traffic. A budget alert may notify but should not be treated as a guaranteed hard spending cap; enforce application-side usage limits as well.

## Current safe defaults and limits

- Model: `gpt-4.1-mini`
- Maximum output: 1,400 tokens per request
- Maximum provider response body: 256 KiB; oversized responses are rejected before full buffering
- Application limit: 4 requests per account per minute (in-memory per service instance)
- Provider timeout: 25 seconds
- No automatic retries, to avoid unexpected duplicate usage
- No prompt or response body logging by the API
- No API key configured in the current Render deployment
- No live OpenAI request has been made or billed

## Verification status

The CI integration test uses a local mock provider. It verifies the authenticated request, server-side bearer key handling, selected model, bounded output setting and returned plan. This validates the application integration contract only; it does not verify a live OpenAI credential, account billing, model access or production inference.

## Operational note

The per-account request limiter is process-local. It is a useful baseline for the current single-instance prototype, not a durable multi-instance quota system. Before scaling, move usage accounting to PostgreSQL or a shared rate-limit store and add a global spend-control mechanism.
