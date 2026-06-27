import { test, expect } from "@playwright/test";
import { dismissUploadPromptIfVisible, resetClientStorage } from "./helpers/ui.js";

test.describe("FinanceOS UI (mock mode)", () => {
  test.beforeEach(async ({ page }) => {
    await resetClientStorage(page);
    await page.goto("/");
    await dismissUploadPromptIfVisible(page);
  });

  test("loads overview with FinanceOS branding and document title", async ({ page }) => {
    await expect(page).toHaveTitle(/Overview · FinanceOS/);
    await expect(page.getByText("FinanceOS", { exact: true }).first()).toBeVisible();
  });

  test("navigates primary routes from the sidebar", async ({ page }) => {
    const routes = [
      { link: "Transactions", path: "/transactions", title: /Transactions · FinanceOS/ },
      { link: "Categories", path: "/categories", title: /Categories · FinanceOS/ },
      { link: "Insights", path: "/insights", title: /Insights · FinanceOS/ },
      { link: "Upload", path: "/upload", title: /Import · FinanceOS/ },
      { link: "Help & Support", path: "/help", title: /Help & Support · FinanceOS/ },
    ];

    for (const route of routes) {
      await page.getByRole("link", { name: route.link, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${route.path.replace("/", "\\/")}$`));
      await expect(page).toHaveTitle(route.title);
    }
  });

  test("shows 404 page for unknown routes", async ({ page }) => {
    await page.goto("/this-route-does-not-exist");
    await dismissUploadPromptIfVisible(page);
    await expect(page.getByRole("heading", { name: /couldn't find that page/i })).toBeVisible();
    await page.getByRole("link", { name: /Take me home/i }).click();
    await expect(page).toHaveURL(/\/$/);
  });

  test("toggles theme and persists preference via Arsenal localStorage helper", async ({
    page,
  }) => {
    const toggle = page.getByRole("button", { name: /Switch to (light|dark) mode/i });
    await expect(toggle).toBeVisible();

    const html = page.locator("html");
    const wasDark = await html.evaluate((el) => el.classList.contains("dark"));

    await toggle.click();

    if (wasDark) {
      await expect(html).not.toHaveClass("dark");
    } else {
      await expect(html).toHaveClass("dark");
    }

    const storedTheme = await page.evaluate(() => localStorage.getItem("financeos.theme"));
    expect(storedTheme).toBe(wasDark ? "light" : "dark");

    await page.reload();
    await dismissUploadPromptIfVisible(page);

    if (wasDark) {
      await expect(html).not.toHaveClass("dark");
    } else {
      await expect(html).toHaveClass("dark");
    }
  });

  test("upload page shows mock-mode analysis options", async ({ page }) => {
    await page.getByRole("link", { name: "Upload", exact: true }).click();
    await expect(page.getByText(/Import transactions from CSV/i)).toBeVisible();
    await expect(page.getByText(/parse in your browser|Local analysis/i)).toBeVisible();
  });
});
