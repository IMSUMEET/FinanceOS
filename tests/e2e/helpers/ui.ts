import type { Page } from "@playwright/test";

/** Dismiss the first-run upload prompt when it blocks the main UI. */
export async function dismissUploadPromptIfVisible(page: Page): Promise<void> {
  const dialog = page.getByRole("dialog");
  const visible = await dialog.isVisible().catch(() => false);
  if (visible) {
    await page.getByRole("button", { name: "Close" }).click();
    await dialog.waitFor({ state: "hidden", timeout: 10_000 });
  }
}

/** Clear FinanceOS client storage once per test (survives reloads in the same test). */
export async function resetClientStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("__financeos_e2e_storage_reset")) return;
    sessionStorage.setItem("__financeos_e2e_storage_reset", "1");
    localStorage.removeItem("finance_os_user_analysis_v1");
    localStorage.removeItem("financeos.theme");
    localStorage.removeItem("financeos.profile.v4");
    localStorage.removeItem("finance_os_alerts_seen_v1");
  });
}
