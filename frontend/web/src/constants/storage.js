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
  for (const key of LEGACY_ANALYSIS_SESSION_KEYS) {
    try {
      sessionStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  }
}

export function migrateSessionAnalysisToLocal() {
  try {
    const raw = sessionStorage.getItem(LEGACY_SESSION_ANALYSIS_KEY);
    if (!raw) return;
    if (!localStorage.getItem(ANALYSIS_STORAGE_KEY)) {
      localStorage.setItem(ANALYSIS_STORAGE_KEY, raw);
    }
    sessionStorage.removeItem(LEGACY_SESSION_ANALYSIS_KEY);
  } catch {
    /* ignore */
  }
}
