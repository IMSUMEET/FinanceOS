/**
 * Insights service. In mock mode all derived analytics are computed locally
 * from the same seed transactions the UI is already using, so swapping in the
 * real backend is a one-line change per call site.
 */

import { apiClient, USE_MOCK } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";
import { _mock as transactionsMock } from "./transactions";
import {
  categoryBreakdown,
  detectRecurring,
  merchantBreakdown,
  monthlyTotals,
  topAnomalies,
  topCategoryMovers,
  totalSpend,
} from "../utils/insights";

/**
 * GET /insights/summary?month=YYYY-MM
 * @returns {Promise<{
 *   total: number,
 *   monthly: import("../types").MonthlyTotal[],
 *   categories: import("../types").CategoryBreakdown[],
 *   merchants: import("../types").MerchantBreakdown[]
 * }>}
 */
export async function getSummary({ month } = {}) {
  if (USE_MOCK) {
    const rows = transactionsMock.read();
    return {
      total: totalSpend(rows),
      monthly: monthlyTotals(rows),
      categories: categoryBreakdown(rows),
      merchants: merchantBreakdown(rows),
    };
  }
  return apiClient.get(ENDPOINTS.insights.summary, { query: { month } });
}

/**
 * GET /insights/movers
 * @returns {Promise<{ movers: import("../types").MoverEntry[] }>}
 */
export async function getMovers({ month } = {}) {
  if (USE_MOCK) {
    return { movers: topCategoryMovers(transactionsMock.read()) };
  }
  return apiClient.get(ENDPOINTS.insights.movers, { query: { month } });
}

/**
 * GET /insights/recurring
 * @returns {Promise<{ items: import("../types").RecurringMerchant[] }>}
 */
export async function getRecurring() {
  if (USE_MOCK) {
    return { items: detectRecurring(transactionsMock.read()) };
  }
  return apiClient.get(ENDPOINTS.insights.recurring);
}

/**
 * GET /insights/anomalies
 * @returns {Promise<{ items: import("../types").Anomaly[] }>}
 */
export async function getAnomalies({ month, limit = 5 } = {}) {
  if (USE_MOCK) {
    return { items: topAnomalies(transactionsMock.read(), limit) };
  }
  return apiClient.get(ENDPOINTS.insights.anomalies, {
    query: { month, limit },
  });
}
