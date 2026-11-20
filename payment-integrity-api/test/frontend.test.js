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
  for (const id of ["workspace-form", "post-form", "listing-form"]) {
    assert.match(html, new RegExp('id="' + id + '"'), "missing UI form: " + id);
  }
  for (const endpoint of [
    "/v1/auth/me",
    "/v1/business/workspace",
    "/v1/community/posts",
    "/v1/marketplace/listings"
  ]) {
    assert.ok(html.includes(endpoint), "missing API integration: " + endpoint);
  }
  assert.doesNotMatch(html, /id="ai-form"/, "disabled AI generation must not be presented as an active form");
  assert.match(html, /AI generation is not active/, "workspace must explain why live AI generation is unavailable");
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
  assert.doesNotMatch(html, /formsubmit\\.co|formsubmit|form-processing provider/i, "enquiry must not claim to use a third-party processor");
});

test("central ALPINOSS pricing page exposes indicative prices and individually agreed terms", async () => {
  const homePath = new URL("../../index.html", import.meta.url);
  const pricingPath = new URL("../../pricing/index.html", import.meta.url);
  const home = await readFile(homePath, "utf8");
  const pricing = await readFile(pricingPath, "utf8");
  assert.match(home, /href="pricing\//);
  for (const price of ["€149", "€295", "€495", "From €950", "€950–€2,500", "€5,000–€15,000+"]) {
    assert.ok(pricing.includes(price), "missing published price: " + price);
  }
  assert.match(pricing, /prices above are indicative starting points/i);
  assert.match(pricing, /final price, scope, deliverables and timeline are discussed and agreed/i);
  assert.match(pricing, /payment method, schedule and any milestones are also agreed individually/i);
  assert.doesNotMatch(pricing, /50% upfront|50% after delivery|30% upfront/i);
  assert.match(pricing, /one-time payments/i);
  assert.doesNotMatch(pricing, /29\.99|monthly membership fee|subscription checkout/i);
  assert.match(pricing, /no monthly membership or recurring platform fee/i);
  assert.doesNotMatch(pricing, /29\.99|monthly membership fee|subscription checkout/i);
});


test("account sign-in session is shared with the member workspace", async () => {
  const account = await readFile(accountPath, "utf8");
  const workspace = await readFile(appPath, "utf8");
  assert.match(account, /sessionStorage\.setItem\(["']alpinoss_web_token["']/);
  assert.match(account, /sessionStorage\.setItem\(["']alpinoss_web_email["']/);
  assert.match(workspace, /sessionStorage\.getItem\(["']alpinoss_web_token["']/);
  assert.match(workspace, /sessionStorage\.removeItem\(["']alpinoss_web_token["']/);
  assert.match(workspace, /sessionStorage\.removeItem\(["']alpinoss_web_email["']/);
  assert.doesNotMatch(workspace, /nexora_web_token|nexora_web_email/);
});

test("homepage core areas open their matching ALPINOSS workspace modules", async () => {
  const homePath = new URL("../../index.html", import.meta.url);
  const workspacePath = new URL("../../app/index.html", import.meta.url);
  const home = await readFile(homePath, "utf8");
  const workspace = await readFile(workspacePath, "utf8");
  for (const route of ["platform", "technology", "marketplace", "community"]) {
    assert.ok(home.includes('href="app/#' + route + '"'), "homepage must link to " + route);
  }
  assert.match(workspace, /const routeToTab=\{platform:"business",business:"business",technology:"technology",marketplace:"marketplace",community:"community"\}/);
  assert.match(workspace, /window\.addEventListener\("hashchange",activateFromHash\)/);
  const script = workspace.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
  assert.ok(script, "workspace page must include its application script");
  assert.doesNotThrow(() => new vm.Script(script), "workspace application script must parse");
});

test("official ALPINOSS logo is the first screen and opens the main menu on tap", async () => {
  const html = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  assert.match(html, /<button id="alpinoss-splash"[^>]*aria-label="Enter ALPINOSS"/);
  assert.match(html, /<img src="assets\/alpinoss-official\.jpg" alt="Official ALPINOSS logo — Next Level Together"/);
  assert.match(html, /<div id="site-shell" hidden>/);
  assert.ok(html.indexOf('id="alpinoss-splash"') < html.indexOf('id="site-shell"'), "logo screen must appear before the site menu");
  assert.match(html, /splash\.addEventListener\("click",\s*\(\)\s*=>\s*\{\s*splash\.hidden = true;\s*shell\.hidden = false;/);
  for (const area of ["Platform", "Technology", "Marketplace", "Community"]) {
    assert.ok(html.includes(">" + area + "</h2>"), "main menu must include " + area);
  }
});


test("mobile Payment Integrity sends synthetic events to the backend screening API", async () => {
  const mobilePath = new URL("../../mobile/App.tsx", import.meta.url);
  const serverPath = new URL("../src/server.js", import.meta.url);
  const mobile = await readFile(mobilePath, "utf8");
  const server = await readFile(serverPath, "utf8");
  assert.match(mobile, /apiRequest\(["']\/v1\/demo\/events["']/);
  assert.match(mobile, /currency:\s*["']EUR["']/);
  assert.match(mobile, /status:\s*["']SUCCESS["']/);
  assert.match(mobile, /setDecision\(data\.decision\)/);
  assert.doesNotMatch(mobile, /const screening = useMemo/);
  assert.match(server, /if \(req\.headers\.origin && req\.headers\.origin !== DEMO_ORIGIN\)/);
  assert.match(server, /pathname === "\/v1\/demo\/events"/);
});
