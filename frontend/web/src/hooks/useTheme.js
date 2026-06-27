import { createThemeHook } from "@oblivion-labs/arsenal-frontend";

export const useTheme = createThemeHook({
  storageKey: "financeos.theme",
  metaColors: { dark: "#080f1e", light: "#edf4ff" },
});
