import fs from "node:fs";
import path from "node:path";
import { test, expect } from "@playwright/test";

const VERCEL_URL =
  process.env.VERCEL_PREVIEW_URL ??
  process.env.PLAYWRIGHT_WEB_URL ??
  "https://finance-os-git-feat-ai-reports-lambda-oblivion-labs.vercel.app";

const OUT_DIR = path.resolve("playwright-report/vercel-debug");
const sampleCsv = path.resolve("tests/e2e/fixtures/sample.csv");

test.describe("Vercel preview — upload / AI analysis", () => {
  test("capture UI state, network, and screenshots", async ({ page }) => {
    fs.mkdirSync(OUT_DIR, { recursive: true });

    const networkLog: string[] = [];
    page.on("request", (req) => {
      const url = req.url();
      if (
        url.includes("execute-api") ||
        url.includes("ai-analyze") ||
        url.includes("/api/analyze")
      ) {
        networkLog.push(`REQ ${req.method()} ${url}`);
      }
    });
    page.on("response", async (res) => {
      const url = res.url();
      if (
        url.includes("execute-api") ||
        url.includes("ai-analyze") ||
        url.includes("/api/analyze")
      ) {
        networkLog.push(`RES ${res.status()} ${url}`);
      }
    });

    await page.goto(`${VERCEL_URL}/upload`, { waitUntil: "domcontentloaded", timeout: 60_000 });

    const onVercelLogin = await page
      .getByRole("heading", { name: /Log in to Vercel/i })
      .isVisible()
      .catch(() => false);
    if (onVercelLogin) {
      await page.screenshot({
        path: path.join(OUT_DIR, "01-vercel-sso-login-wall.png"),
        fullPage: true,
      });
      fs.writeFileSync(
        path.join(OUT_DIR, "00-page-hints.txt"),
        `url: ${VERCEL_URL}/upload\nblockedByVercelSso: true\n`,
      );
      test.skip(
        true,
        "Vercel preview requires SSO login — use PLAYWRIGHT_WEB_URL=http://127.0.0.1:4173",
      );
      return;
    }

    await page.waitForLoadState("networkidle").catch(() => {});
    await page.screenshot({ path: path.join(OUT_DIR, "01-upload-initial.png"), fullPage: true });

    const bodyText = await page.locator("body").innerText();
    const mockModeHint = bodyText.includes("Mock mode");
    const requiresApiHint = bodyText.includes("Requires API URL");

    const aiButton = page.getByRole("button", { name: "AI analysis" });
    const localButton = page.getByRole("button", { name: "Local analysis" });

    fs.writeFileSync(
      path.join(OUT_DIR, "00-page-hints.txt"),
      [
        `url: ${VERCEL_URL}/upload`,
        `mockModeHintVisible: ${mockModeHint}`,
        `requiresApiUrlHintVisible: ${requiresApiHint}`,
        `aiButtonVisibleBeforeUpload: ${await aiButton.isVisible().catch(() => false)}`,
        `localButtonVisibleBeforeUpload: ${await localButton.isVisible().catch(() => false)}`,
      ].join("\n"),
    );

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(sampleCsv);
    await page.waitForTimeout(1500);
    await page.screenshot({
      path: path.join(OUT_DIR, "02-after-csv-selected.png"),
      fullPage: true,
    });

    const aiDisabled = await aiButton.isDisabled();
    const localDisabled = await localButton.isDisabled();
    const aiTitle = (await aiButton.getAttribute("title")) ?? "";

    fs.appendFileSync(
      path.join(OUT_DIR, "00-page-hints.txt"),
      `\naiButtonDisabled: ${aiDisabled}\nlocalButtonDisabled: ${localDisabled}\naiButtonTitle: ${aiTitle}\n`,
    );

    if (aiDisabled) {
      await page.screenshot({
        path: path.join(OUT_DIR, "03-ai-button-disabled.png"),
        fullPage: true,
      });
      fs.writeFileSync(
        path.join(OUT_DIR, "network.log"),
        networkLog.join("\n") || "(no API calls)",
      );
      expect
        .soft(aiDisabled, "AI button disabled — check Vercel env VITE_USE_MOCK / VITE_API_BASE_URL")
        .toBe(false);
      return;
    }

    await aiButton.click();
    await page.waitForTimeout(3000);
    await page.screenshot({ path: path.join(OUT_DIR, "04-after-ai-click-3s.png"), fullPage: true });

    try {
      await page.waitForResponse(
        (res) => res.url().includes("ai-analyze") || res.url().includes("execute-api"),
        { timeout: 45_000 },
      );
    } catch {
      // continue — log what we have
    }

    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(OUT_DIR, "05-final-state.png"), fullPage: true });

    const errorVisible = await page
      .getByText("Could not analyze")
      .isVisible()
      .catch(() => false);
    const successVisible = await page
      .getByText(/transactions analyzed/i)
      .isVisible()
      .catch(() => false);

    fs.writeFileSync(
      path.join(OUT_DIR, "00-page-hints.txt"),
      fs.readFileSync(path.join(OUT_DIR, "00-page-hints.txt"), "utf8") +
        `\nerrorVisible: ${errorVisible}\nsuccessVisible: ${successVisible}\n`,
    );
    fs.writeFileSync(
      path.join(OUT_DIR, "network.log"),
      networkLog.join("\n") || "(no API calls to AWS)",
    );

    expect(
      networkLog.some((line) => line.includes("ai-analyze") || line.includes("execute-api")),
    ).toBe(true);
  });
});
