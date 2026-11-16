const configuredApiUrl = process.env.EXPO_PUBLIC_NEXORA_API_URL || "https://nexora-payment-integrity-api.onrender.com";

export const API_BASE = configuredApiUrl.trim().replace(/\/+$/, "");

export type ApiRequestResult = {
  ok: boolean;
  status: number;
  data: Record<string, any>;
};

/**
 * Sends an API request with a bounded timeout and safely parses JSON responses.
 * Render's free service may need time to wake after inactivity, so the default
 * timeout allows a cold start while still preventing an endless loading state.
 */
export async function apiRequest(
  path: string,
  init: RequestInit = {},
  timeoutMs = 45_000
): Promise<ApiRequestResult> {
  if (!API_BASE) {
    throw new Error("Serwer ALPINOSS nie jest skonfigurowany.");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(API_BASE + path, {
      ...init,
      signal: controller.signal
    });
    const rawBody = await response.text();
    let data: Record<string, any> = {};
    let validJson = true;

    if (rawBody.trim()) {
      try {
        const parsed: unknown = JSON.parse(rawBody);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Invalid API response shape");
        }
        data = parsed as Record<string, any>;
      } catch {
        validJson = false;
        data = { error: "Serwer ALPINOSS zwrócił nieprawidłową odpowiedź." };
      }
    }

    return {
      ok: response.ok && validJson,
      status: response.status,
      data
    };
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Serwer ALPINOSS nie odpowiedział w wyznaczonym czasie. Sprawdź połączenie i spróbuj ponownie.");
    }
    if (error instanceof TypeError) {
      throw new Error("Nie można połączyć się z serwerem ALPINOSS. Sprawdź połączenie internetowe.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
