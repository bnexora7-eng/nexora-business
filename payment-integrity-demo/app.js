(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const form = $("eventForm");
  const resultBox = $("result");
  const testBox = $("apiTestResults");
  const apiBase = String(window.NEXORA_API_BASE_URL || "").replace(/\/+$/, "");
  const rows = [];
  let accepted = 0, flagged = 0;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[c]);
  }
  function status(message, ok = true) {
    const el = $("appStatus");
    if (!el) return;
    el.textContent = message;
    el.className = ok ? "muted" : "reject";
  }
  function stats() {
    $("total").textContent = rows.length;
    $("accepted").textContent = accepted;
    $("flagged").textContent = flagged;
  }
  function renderLog() {
    $("log").innerHTML = rows.length ? rows.map((r) =>
      "<tr><td>" + escapeHtml(r.time) + "</td><td>" + escapeHtml(r.provider) +
      "</td><td>" + escapeHtml(r.event) + "</td><td>" + Number(r.amount).toFixed(2) +
      " " + escapeHtml(r.currency) + "</td><td class='" + r.decision.toLowerCase() +
      "'>" + escapeHtml(r.decision) + "</td><td>" + escapeHtml(r.reason) +
      "</td></tr>"
    ).join("") : '<tr><td colspan="6" class="muted">No events evaluated yet.</td></tr>';
  }
  function showDecision(item) {
    resultBox.innerHTML = '<div class="muted">DECISION OUTPUT</div><div class="decision ' +
      item.decision.toLowerCase() + '">' + escapeHtml(item.decision) +
      '</div><div class="muted">' + escapeHtml(item.reason) +
      '</div><div class="muted">Reference: ' + escapeHtml(item.provider) +
      " / " + escapeHtml(item.event) + "</div>";
  }
  function record(data, decision, reason) {
    const item = { time: new Date().toLocaleTimeString(), ...data, decision, reason };
    rows.unshift(item);
    if (decision === "ACCEPT") accepted++; else flagged++;
    stats(); renderLog(); showDecision(item);
  }
  async function apiRequest(path, options = {}) {
    const response = await fetch(apiBase + path, { cache: "no-store", ...options });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || ("HTTP " + response.status));
    return body;
  }
  function readForm() {
    return {
      provider: $("provider").value.trim(),
      event: $("event").value.trim(),
      amount: Number($("amount").value),
      currency: $("currency").value,
      status: $("status").value
    };
  }

  if (!form || !resultBox || !$("apiTests")) {
    status("Demo controls could not initialize. Reload this page.", false);
    return;
  }
  status("Demo controls loaded. API: " + (apiBase || "not configured"));

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const data = readForm();
    if (!data.provider || !data.event || !Number.isFinite(data.amount) || data.amount <= 0) {
      status("Enter provider, event identifier and a positive amount.", false);
      return;
    }
    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Sending…";
    resultBox.innerHTML = '<div class="muted">Sending event to the NEXORA API…</div>';
    try {
      if (!apiBase) throw new Error("API URL is not configured.");
      const body = await apiRequest("/v1/demo/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider_id: data.provider,
          event_id: data.event,
          amount: data.amount,
          currency: data.currency,
          status: data.status
        })
      });
      record(data, body.decision, body.reason || "Server decision returned.");
      status("Event processed by the live demo API.");
    } catch (error) {
      resultBox.innerHTML = '<div class="muted">API ERROR</div><div class="decision reject">NOT PROCESSED</div><div class="muted">' +
        escapeHtml(error.message) + "</div>";
      status("API request failed: " + error.message, false);
    } finally {
      submit.disabled = false;
      submit.textContent = "Evaluate event";
    }
  });

  $("sample").addEventListener("click", () => {
    $("provider").value = "demo-provider";
    $("event").value = "evt-review-" + Date.now();
    $("amount").value = "950";
    $("currency").value = "EUR";
    $("status").value = "pending";
    form.requestSubmit();
  });

  $("apiTests").addEventListener("click", async () => {
    const button = $("apiTests");
    button.disabled = true;
    testBox.hidden = false;
    testBox.innerHTML = '<div class="muted">Running live API checks…</div>';
    try {
      if (!apiBase) throw new Error("API URL is not configured.");
      const health = await apiRequest("/health");
      const stamp = Date.now();
      const cases = [
        { label: "ACCEPT", event: "nexora-accept-" + stamp, status: "succeeded", expected: "ACCEPT" },
        { label: "REVIEW", event: "nexora-review-" + stamp, status: "pending", expected: "REVIEW" },
        { label: "REJECT", event: "nexora-reject-" + stamp, status: "failed", expected: "REJECT" }
      ];
      const send = (item) => apiRequest("/v1/demo/events", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider_id: "demo-provider", event_id: item.event, amount: 25, currency: "EUR", status: item.status })
      });
      const outcomes = [];
      for (const item of cases) {
        const answer = await send(item);
        outcomes.push({ label: item.label, pass: answer.decision === item.expected, detail: answer.decision + " — " + (answer.reason || "") });
      }
      const duplicateId = "nexora-duplicate-" + stamp;
      const first = await send({ event: duplicateId, status: "succeeded" });
      const second = await send({ event: duplicateId, status: "succeeded" });
      outcomes.push({
        label: "DUPLICATE",
        pass: first.decision === "ACCEPT" && second.decision === "REJECT" && second.duplicate === true,
        detail: "First: " + first.decision + "; replay: " + second.decision + "; duplicate flag: " + String(second.duplicate)
      });
      const allPass = outcomes.every((x) => x.pass);
      testBox.innerHTML = '<div class="muted">LIVE SERVER TEST RESULTS</div>' +
        outcomes.map((x) => '<div class="' + (x.pass ? "accept" : "reject") + '"><b>' +
          (x.pass ? "PASS" : "FAIL") + "</b> — " + escapeHtml(x.label) +
          '</div><div class="muted">' + escapeHtml(x.detail) + "</div>").join("") +
        '<div class="decision ' + (allPass ? "accept" : "reject") + '">' +
        (allPass ? "ALL SERVER TESTS PASSED" : "TEST FAILURE") + "</div>" +
        '<div class="muted">API health: ' + escapeHtml(health.status) + " · " + escapeHtml(health.service) + "</div>";
      status(allPass ? "All live API checks passed." : "One or more live API checks failed.", allPass);
    } catch (error) {
      testBox.innerHTML = '<div class="decision reject">CONNECTION / API ERROR</div><div class="muted">' +
        escapeHtml(error.message) + "</div>";
      status("Server checks failed: " + error.message, false);
    } finally {
      button.disabled = false;
    }
  });

  $("clear").addEventListener("click", () => {
    rows.length = 0; accepted = 0; flagged = 0;
    stats(); renderLog();
    resultBox.innerHTML = '<div class="muted">Session log cleared.</div>';
    status("Session log cleared.");
  });
})();