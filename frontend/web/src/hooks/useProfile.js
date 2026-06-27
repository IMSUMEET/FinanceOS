import { useCallback } from "react";
import { usePersistedState } from "@oblivion-labs/arsenal-frontend";
import { AVATAR_VARIANTS } from "../utils/personality";

const STORAGE_KEY = "financeos.profile.v4";
const DEFAULT_PROFILE = {
  name: "",
  handle: "",
  avatarVariant: "blue",
  profileCompleted: false,
};

export function useProfile() {
  const [profile, setProfile] = usePersistedState(STORAGE_KEY, DEFAULT_PROFILE);

  const updateProfile = useCallback(
    (patch) => {
      setProfile(patch);
    },
    [setProfile],
  );

  const cycleAvatar = useCallback(() => {
    setProfile((prev) => {
      const idx = AVATAR_VARIANTS.indexOf(prev.avatarVariant);
      const nextIdx = (idx + 1) % AVATAR_VARIANTS.length;
      return { avatarVariant: AVATAR_VARIANTS[nextIdx] };
    });
  }, [setProfile]);

  const hasProfile = Boolean(
    profile.profileCompleted &&
    String(profile.name ?? "").trim() &&
    String(profile.handle ?? "").trim(),
  );
  const displayName = hasProfile ? `${profile.name} ${profile.handle}`.trim() : "Guest user";

  return { profile, updateProfile, cycleAvatar, hasProfile, displayName };
}
