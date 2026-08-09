import { API_BASE_URL } from "./client.js";

async function parseResponse(res) {
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }
  return { ok: res.ok, status: res.status, data: data || {} };
}

export async function fetchPlaidConfig() {
  const res = await fetch(`${API_BASE_URL}/api/plaid/config`);
  const { ok, data } = await parseResponse(res);
  if (!ok) throw new Error(data.message || "Failed to fetch Plaid configuration status");
  return data;
}

export async function createLinkToken(connectionId) {
  const res = await fetch(`${API_BASE_URL}/api/plaid/link-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ connectionId }),
  });
  const { ok, data } = await parseResponse(res);
  if (!ok || data.status !== "success") {
    throw new Error(data.message || "Failed to generate Plaid Link token");
  }
  return data;
}

export async function exchangePublicToken(publicToken, metadata) {
  const res = await fetch(`${API_BASE_URL}/api/plaid/exchange-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ public_token: publicToken, metadata }),
  });
  const { ok, data } = await parseResponse(res);
  if (!ok || data.status !== "success") {
    throw new Error(data.message || "Failed to exchange public token");
  }
  return data;
}

export async function fetchConnections() {
  const res = await fetch(`${API_BASE_URL}/api/plaid/connections`);
  const { ok, data } = await parseResponse(res);
  if (!ok || data.status !== "success") {
    throw new Error(data.message || "Failed to fetch connections");
  }
  return data;
}

export async function syncConnection(connectionId, options = {}) {
  const query = options.resetCursor ? "?resetCursor=true" : "";
  const res = await fetch(`${API_BASE_URL}/api/plaid/connections/${connectionId}/sync${query}`, {
    method: "POST",
  });
  const { ok, data } = await parseResponse(res);
  if (!ok || data.status !== "success") {
    const error = new Error(data.message || "Failed to sync connection");
    error.code = data.code;
    throw error;
  }
  return data;
}

export async function createUpdateLinkToken(connectionId) {
  const res = await fetch(
    `${API_BASE_URL}/api/plaid/connections/${connectionId}/update-link-token`,
    {
      method: "POST",
    },
  );
  const { ok, data } = await parseResponse(res);
  if (!ok || data.status !== "success") {
    throw new Error(data.message || "Failed to create update Link token");
  }
  return data;
}

export async function disconnectConnection(connectionId) {
  const res = await fetch(`${API_BASE_URL}/api/plaid/connections/${connectionId}`, {
    method: "DELETE",
  });
  const { ok, data } = await parseResponse(res);
  if (!ok || data.status !== "success") {
    throw new Error(data.message || "Failed to disconnect institution");
  }
  return data;
}
