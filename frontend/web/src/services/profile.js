/**
 * Profile service. The mock implementation reads/writes localStorage so the
 * choice of avatar variant survives reloads exactly the way it would once a
 * real backend is wired up.
 */

import { apiClient, USE_MOCK } from "../api/client";
import { ENDPOINTS } from "../api/endpoints";

const STORAGE_KEY = "financeos.profile.v4";
const DEFAULT_PROFILE = {
  name: "",
  handle: "",
  avatarVariant: "blue",
  profileCompleted: false,
};

function readLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeLocal(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode errors
  }
}

/**
 * GET /profile
 * @returns {Promise<import("../types").Profile>}
 */
export async function getProfile() {
  if (USE_MOCK) return readLocal();
  return apiClient.get(ENDPOINTS.profile.get);
}

/**
 * PATCH /profile
 * @param {Partial<import("../types").Profile>} patch
 * @returns {Promise<import("../types").Profile>}
 */
export async function updateProfile(patch) {
  if (USE_MOCK) {
    const next = { ...readLocal(), ...patch };
    writeLocal(next);
    return next;
  }
  return apiClient.patch(ENDPOINTS.profile.update, patch);
}
