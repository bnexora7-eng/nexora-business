// Call the Netlify function directly to bypass the /v1 rewrite layer.
// This sandbox does not connect to live banks or move money.
window.NEXORA_API_BASE_URL = "https://splendid-lokum-02523e.netlify.app/.netlify/functions/demo-events";
