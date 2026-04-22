import { useCallback, useEffect, useState } from "react";
import { AVATAR_VARIANTS } from "../utils/personality";

const STORAGE_KEY = "financeos.profile.v4";
const DEFAULT_PROFILE = {
  name: "",
  handle: "",
  avatarVariant: "blue",
  profileCompleted: false,
};

const subscribers = new Set();

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

function writeStorage(next) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
  subscribers.forEach((cb) => cb(next));
}

export function useProfile() {
  const [profile, setProfile] = useState(() =>
    typeof window === "undefined" ? DEFAULT_PROFILE : readStorage(),
  );

  useEffect(() => {
    const cb = (p) => setProfile(p);
    subscribers.add(cb);
    return () => {
      subscribers.delete(cb);
    };
  }, []);

  const updateProfile = useCallback((patch) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(next);
      return next;
    });
  }, []);

  const cycleAvatar = useCallback(() => {
    setProfile((prev) => {
      const idx = AVATAR_VARIANTS.indexOf(prev.avatarVariant);
      const nextIdx = (idx + 1) % AVATAR_VARIANTS.length;
      const next = { ...prev, avatarVariant: AVATAR_VARIANTS[nextIdx] };
      writeStorage(next);
      return next;
    });
  }, []);

  const hasProfile = Boolean(
    profile.profileCompleted &&
      String(profile.name ?? "").trim() &&
      String(profile.handle ?? "").trim(),
  );
  const displayName = hasProfile
    ? `${profile.name} ${profile.handle}`.trim()
    : "Guest user";

  return { profile, updateProfile, cycleAvatar, hasProfile, displayName };
}
