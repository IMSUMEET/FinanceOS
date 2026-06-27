import {
  clearSessionStorageKeys,
  migrateSessionToLocal,
} from "@oblivion-labs-dev/arsenal-frontend";

/** localStorage key for user-imported analysis (not raw files). */
export const ANALYSIS_STORAGE_KEY = "finance_os_user_analysis_v1";

/** @deprecated upload prompt dismiss is in-memory only; cleared on startup for legacy tabs. */
export const UPLOAD_PROMPT_DISMISSED_KEY = "finance_os_upload_prompt_dismissed";

/** localStorage set of alert IDs the user has seen. */
export const ALERTS_SEEN_KEY = "finance_os_alerts_seen_v1";

/** Older sessionStorage keys — cleared on startup. */
export const LEGACY_ANALYSIS_SESSION_KEYS = ["finance_os_latest_analysis"];

/** Same key name previously used in sessionStorage — migrated to localStorage. */
export const LEGACY_SESSION_ANALYSIS_KEY = "finance_os_user_analysis_v1";

export function clearLegacyAnalysisSessions() {
  clearSessionStorageKeys(LEGACY_ANALYSIS_SESSION_KEYS);
}

export function migrateSessionAnalysisToLocal() {
  migrateSessionToLocal(LEGACY_SESSION_ANALYSIS_KEY, ANALYSIS_STORAGE_KEY);
}
