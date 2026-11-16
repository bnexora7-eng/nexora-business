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
  assert.doesNotMatch(script, /subscriptions\/me|29\.99|All Access required/i, "workspace must not enforce a paid membership");
  for (const id of ["workspace-form", "ai-form", "post-form", "listing-form"]) {
    assert.match(html, new RegExp('id="' + id + '"'), "missing UI form: " + id);
  }
  for (const endpoint of [
    "/v1/auth/me",
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
  assert.match(html, /href="\.\.\/app\/">OPEN ALPINOSS WORKSPACE/);
  assert.doesNotMatch(html, /€29\.99|ALPINOSS All Access|subscribe-button/i, "account page must not advertise or expose subscription checkout");
});

test("project enquiry form prepares a local email without a third-party form processor", async () => {
  const orderPath = new URL("../../order.html", import.meta.url);
  const html = await readFile(orderPath, "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script, "project enquiry page must include its form script");
  assert.doesNotThrow(() => new vm.Script(script), "project enquiry script must parse");
  assert.match(html, /Prepare email enquiry/);
  assert.match(script, /mailto:alpinoosalpinoos@gmail\.com/);
  assert.match(html, /privacy notice/);
  assert.doesNotMatch(html, /formsubmit\\.co|formsubmit/i, "enquiry data must not be sent to an unreviewed third-party form processor");
});

test("central ALPINOSS pricing page exposes all prices and milestone terms", async () => {
  const homePath = new URL("../../index.html", import.meta.url);
  const pricingPath = new URL("../../pricing/index.html", import.meta.url);
  const home = await readFile(homePath, "utf8");
  const pricing = await readFile(pricingPath, "utf8");
  assert.match(home, /href="pricing\//);
  for (const price of ["€149", "€295", "€495", "From €950", "€950–€2,500", "€5,000–€15,000+"]) {
    assert.ok(pricing.includes(price), "missing published price: " + price);
  }
  assert.match(pricing, /50% upfront/);
  assert.match(pricing, /50% after/);
  assert.match(pricing, /30% upfront/);
  assert.match(pricing, /one-time payments/i);
  assert.match(pricing, /no monthly membership or recurring platform fee/i);
  assert.doesNotMatch(pricing, /29\.99|monthly membership fee|subscription checkout/i);
});
