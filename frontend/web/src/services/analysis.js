import { API_BASE_URL, USE_MOCK } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

/**
 * POST multipart CSVs to Lambda. Do not use when USE_MOCK is true.
 * @param {FormData} formData — append files under field name `files`
 * @returns {Promise<object>}
 */
export async function analyzeCsvFormData(formData) {
  if (USE_MOCK) {
    throw new Error("analyzeCsvFormData is not used in mock mode.");
  }

  const url = `${API_BASE_URL}${ENDPOINTS.analyze}`;
  const res = await fetch(url, {
    method: "POST",
    body: formData,
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  });

  const text = await res.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = { message: text || "Invalid response" };
  }

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && (body.message || body.error)) ||
      `Request failed (${res.status})`;
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  return body;
}
