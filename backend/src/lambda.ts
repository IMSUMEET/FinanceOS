import { handle } from "hono/aws-lambda";
import { app } from "./index.js";

// AI CSV analyze lives on FinanceOsAiCsvAnalyzerStack (Lambda 2) only.
// Local dev mounts aiApp in local.ts; production frontend uses VITE_AI_ANALYZER_URL.

export const handler = handle(app);
