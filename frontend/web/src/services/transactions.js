/**
 * Transactions service — the rest of the app should import from here, never
 * call `apiClient` directly. While `USE_MOCK` is true (the default for local
 * dev) every function resolves with seeded mock data so the UI keeps working.
 *
 * Each method's return shape matches `src/types/schema.json` exactly. The
 * inline `@example` blocks document the response payload the backend should
 * produce.
 */

import { apiClient, USE_MOCK } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import seed from "../data/mockTransactions";
import { categorize, normalizeMerchant } from "../utils/categorize";

let mockStore = [...seed];

function nextId() {
  return mockStore.reduce((m, r) => Math.max(m, r.id ?? 0), 0) + 1;
}

function clone(rows) {
  return rows.map((r) => ({ ...r }));
}

/**
 * GET /transactions
 * @param {object} [filters] see `Filters` schema
 * @returns {Promise<{ rows: import("../types").Transaction[] }>}
 * @example { "rows": [{ "id": 1, "date": "2026-04-12", ... }] }
 */
export async function listTransactions(filters = {}) {
  if (USE_MOCK) return { rows: clone(mockStore) };
  return apiClient.get(ENDPOINTS.transactions.list, { query: filters });
}

/**
 * PATCH /transactions/:id
 * @returns {Promise<import("../types").Transaction>}
 */
export async function updateTransactionCategory(id, category) {
  if (USE_MOCK) {
    mockStore = mockStore.map((t) => (t.id === id ? { ...t, category } : t));
    return mockStore.find((t) => t.id === id);
  }
  return apiClient.patch(ENDPOINTS.transactions.update(id), { category });
}

/**
 * DELETE /transactions/:id
 * @returns {Promise<{ ok: true }>}
 */
export async function deleteTransaction(id) {
  if (USE_MOCK) {
    mockStore = mockStore.filter((t) => t.id !== id);
    return { ok: true };
  }
  return apiClient.del(ENDPOINTS.transactions.remove(id));
}

/**
 * POST /transactions/import
 * @param {{ rows: import("../types").TransactionImport[] }} payload
 * @returns {Promise<{ imported: number, rows: import("../types").Transaction[] }>}
 */
export async function importTransactions(payload) {
  if (USE_MOCK) {
    const startId = nextId();
    const stamped = payload.rows.map((r, i) => {
      const merchantNorm = r.merchant_normalized ?? normalizeMerchant(r.merchant_raw ?? "");
      return {
        id: r.id ?? startId + i,
        currency: r.currency ?? "USD",
        source: r.source ?? "import",
        merchant_normalized: merchantNorm,
        category: r.category ?? categorize(merchantNorm, r.merchant_raw ?? ""),
        ...r,
      };
    });
    mockStore = [...mockStore, ...stamped];
    return { imported: stamped.length, rows: stamped };
  }
  return apiClient.post(ENDPOINTS.transactions.importBatch, payload);
}

/**
 * Replace the entire mock store. Only meaningful in mock mode — the backend
 * does not expose a "wipe and reseed" endpoint for safety.
 */
export async function _replaceAllMock(rows) {
  if (!USE_MOCK) {
    throw new Error("_replaceAllMock is only available in mock mode");
  }
  mockStore = clone(rows);
  return { ok: true, count: mockStore.length };
}

export const _mock = {
  read: () => clone(mockStore),
  reset: () => {
    mockStore = [...seed];
  },
};
