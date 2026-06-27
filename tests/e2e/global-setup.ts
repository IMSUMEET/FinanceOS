import { startOpenRouterMock } from "./helpers/openrouter-mock.js";

export default async function globalSetup() {
  if (process.env.OPENROUTER_LIVE === "1") {
    return;
  }

  const chatUrl = await startOpenRouterMock();
  process.env.OPENROUTER_API_URL = chatUrl;
  process.env.OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "playwright-mock-key";
}
