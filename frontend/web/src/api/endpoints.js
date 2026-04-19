/**
 * Single source of truth for backend endpoint paths. Keep this file in lockstep
 * with `src/types/README.md` so backend engineers and frontend services agree
 * on the URL surface.
 */

export const ENDPOINTS = {
  transactions: {
    list: "/transactions",
    create: "/transactions",
    update: (id) => `/transactions/${encodeURIComponent(id)}`,
    remove: (id) => `/transactions/${encodeURIComponent(id)}`,
    importBatch: "/transactions/import",
  },
  insights: {
    summary: "/insights/summary",
    movers: "/insights/movers",
    recurring: "/insights/recurring",
    anomalies: "/insights/anomalies",
  },
  notifications: {
    list: "/notifications",
    markRead: (id) => `/notifications/${encodeURIComponent(id)}/read`,
  },
  profile: {
    get: "/profile",
    update: "/profile",
  },
};
