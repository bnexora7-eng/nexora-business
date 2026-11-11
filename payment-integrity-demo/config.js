// Netlify hosts the live serverless demo API on the same origin.
// Keep GitHub Pages in local simulation mode until its API is separately configured.
window.NEXORA_API_BASE_URL = window.location.hostname.endsWith("github.io") ? "" : window.location.origin;
