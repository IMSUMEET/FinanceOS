import { createThemeHook } from "@oblivion-labs-dev/arsenal-frontend";

export const useTheme = createThemeHook({
  storageKey: "financeos.theme",
  metaColors: { dark: "#080f1e", light: "#edf4ff" },
});
