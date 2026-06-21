import { apiClient, USE_MOCK } from "../api/client";

export async function submitSupportRequest({ name, email, subject, message, attachments = [] }) {
  const payload = {
    name: String(name ?? "").trim(),
    email: String(email ?? "").trim(),
    subject: String(subject ?? "").trim(),
    message: String(message ?? "").trim(),
  };

  if (!payload.name || !payload.email || !payload.subject || !payload.message) {
    throw new Error("Please fill in all fields.");
  }

  const files = Array.from(attachments || []).filter(Boolean);

  if (USE_MOCK) {
    console.info("[support]", payload, {
      attachments: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
    });
    await new Promise((r) => setTimeout(r, 400));
    return { ok: true };
  }

  if (files.length > 0) {
    const formData = new FormData();
    formData.append("name", payload.name);
    formData.append("email", payload.email);
    formData.append("subject", payload.subject);
    formData.append("message", payload.message);
    for (const file of files) {
      formData.append("attachments", file, file.name);
    }
    return apiClient.post("/api/support", formData);
  }

  return apiClient.post("/api/support", payload);
}
