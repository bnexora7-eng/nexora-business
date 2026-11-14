import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const appPath = new URL("../../app/index.html", import.meta.url);
const accountPath = new URL("../../account/index.html", import.meta.url);

test("member workspace page has valid JavaScript and all required product sections", async () => {
  const html = await readFile(appPath, "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script, "workspace page must include its application script");
  assert.doesNotThrow(() => new vm.Script(script), "workspace application script must parse");
  for (const id of ["workspace-form", "ai-form", "post-form", "listing-form"]) {
    assert.match(html, new RegExp('id="' + id + '"'), "missing UI form: " + id);
  }
  for (const endpoint of [
    "/v1/auth/me",
    "/v1/subscriptions/me",
    "/v1/business/workspace",
    "/v1/business/ai-plan",
    "/v1/community/posts",
    "/v1/marketplace/listings"
  ]) {
    assert.ok(html.includes(endpoint), "missing API integration: " + endpoint);
  }
  assert.match(html, /Authorization:\s*"Bearer "\s*\+\s*token/);
  assert.doesNotMatch(script, /\.innerHTML\s*=/, "untrusted API content must not be inserted as HTML");
});

test("account dashboard links to the member workspace", async () => {
  const html = await readFile(accountPath, "utf8");
  assert.match(html, /href="\.\.\/app\/">OPEN NEXORA WORKSPACE/);
});
