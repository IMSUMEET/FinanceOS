import { stopOpenRouterMock } from "./helpers/openrouter-mock.js";

export default async function globalTeardown() {
  if (process.env.OPENROUTER_LIVE === "1") {
    return;
  }
  await stopOpenRouterMock();
}
