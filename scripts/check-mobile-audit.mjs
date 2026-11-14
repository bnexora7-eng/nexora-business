import fs from "node:fs";

const reportPath = process.argv[2];
if (!reportPath) throw new Error("Usage: node check-mobile-audit.mjs <npm-audit-json>");
const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
const vulnerabilities = Object.entries(report.vulnerabilities || {});
const allowedBuildOnly = new Map([
  ["image-size", new Set([
    "GHSA-5p2g-fcmc-qvqq",
    "GHSA-w3rx-r6r6-pgpr"
  ])]
]);
const failures = [];
const accepted = [];
const warnings = [];

for (const [name, item] of vulnerabilities) {
  const advisories = (item.via || []).filter(value => value && typeof value === "object");
  const ids = advisories.flatMap(value => [value.source, value.url]).filter(Boolean).map(String);
  const nodes = (item.nodes || []).map(String);
  if (name === "image-size" && item.severity === "high" &&
      nodes.length > 0 && nodes.every(node => node === "node_modules/image-size") &&
      ids.length > 0 && [...allowedBuildOnly.get(name)].every(allowed => ids.some(id => id.includes(allowed)))) {
    accepted.push({ name, severity: item.severity, advisories: ids });
    continue;
  }
  if (item.severity === "critical" || item.severity === "high") {
    failures.push({ name, severity: item.severity, advisories: ids });
  } else {
    warnings.push({ name, severity: item.severity, advisories: ids });
  }
}

console.log(JSON.stringify({
  counts: report.metadata?.vulnerabilities || {},
  acceptedBuildOnlyExceptions: accepted,
  lowerSeverityWarnings: warnings,
  blockingFindings: failures
}, null, 2));

if (accepted.length) {
  console.warn("Accepted narrow exception: image-size is used by Metro during local build asset inspection, is not shipped as app runtime code, and npm currently has no patched release for the two listed advisories. Reassess before each Expo/Metro upgrade.");
}
if (failures.length) process.exit(1);
console.log("PASS: no unapproved high/critical mobile dependency vulnerabilities.");
