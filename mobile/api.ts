const configuredApiUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL || "https://nexora-payment-integrity-api.onrender.com";

export const API_BASE = configuredApiUrl.trim().replace(/\/+$/, "");
