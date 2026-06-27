/**
 * Thin fetch wrapper used by every service module in `src/services`.
 *
 * Two switches drive behaviour, both read from Vite env at build time:
 *   - `VITE_API_BASE_URL`  e.g. `https://api.financeos.dev`
 *   - `VITE_USE_MOCK`      `"true"` to force the in-memory mock provider
 *
 * When `useMock` is true (default during local dev with no API URL set), the
 * service modules short-circuit before they reach `apiClient.request` and
 * resolve with seeded mock data. That lets the app run end-to-end against the
 * mock provider while the backend is being built — without scattering
 * `if (mock) ...` branches across the UI.
 */

const RAW_BASE = import.meta.env.VITE_API_BASE_URL ?? "";
const RAW_AI_BASE = import.meta.env.VITE_AI_ANALYZER_URL ?? "";
const RAW_MOCK = import.meta.env.VITE_USE_MOCK ?? "";

export const API_BASE_URL = String(RAW_BASE).replace(/\/+$/, "");
/** FinanceOsAiCsvAnalyzerStack (Lambda 2) — required for AI analysis; never falls back to Lambda 1. */
export const AI_ANALYZER_BASE_URL = String(RAW_AI_BASE).replace(/\/+$/, "");
export const USE_MOCK = String(RAW_MOCK).toLowerCase() === "true" || API_BASE_URL === "";
/** True when VITE_AI_ANALYZER_URL points at the dedicated AI analyzer API. */
export const LLM_ANALYSIS_AVAILABLE = !USE_MOCK && AI_ANALYZER_BASE_URL !== "";

import { ApiError } from "@oblivion-labs/arsenal-frontend";

export { ApiError };

async function parseBody(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function request(path, { method = "GET", query, body, headers } = {}) {
  if (USE_MOCK) {
    throw new ApiError(
      "apiClient.request called while mock mode is active. Service modules should branch on USE_MOCK before reaching the network layer.",
      { status: 0 },
    );
  }

  const url = new URL(path.startsWith("http") ? path : `${API_BASE_URL}${path}`);
  if (query && typeof query === "object") {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === "") continue;
      if (Array.isArray(value)) {
        for (const v of value) url.searchParams.append(key, String(v));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const init = {
    method,
    headers: {
      Accept: "application/json",
      ...headers,
    },
    credentials: "same-origin",
  };

  if (body instanceof FormData) {
    init.body = body;
  } else if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), init);
  const data = await parseBody(response);

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && data.message) || `Request failed (${response.status})`;
    throw new ApiError(message, { status: response.status, body: data });
  }
  return data;
}

export const apiClient = {
  request,
  get: (path, opts) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts) => request(path, { ...opts, method: "POST", body }),
  patch: (path, body, opts) => request(path, { ...opts, method: "PATCH", body }),
  del: (path, opts) => request(path, { ...opts, method: "DELETE" }),
};
