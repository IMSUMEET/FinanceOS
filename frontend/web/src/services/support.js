import { apiClient, USE_MOCK } from "../api/client";

export async function submitSupportRequest({ name, email, subject, message }) {
  const payload = {
    name: String(name ?? "").trim(),
    email: String(email ?? "").trim(),
    subject: String(subject ?? "").trim(),
    message: String(message ?? "").trim(),
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    throw new Error("Please fill in all fields.");
  }

  if (USE_MOCK) {
    console.info("[support]", payload);
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true };
  }

  return apiClient.post("/api/support", payload);
}
