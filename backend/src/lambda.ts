import { handle } from "hono/aws-lambda";
import { app } from "./index.js";
import { aiApp } from "./aiAnalyzer.js";

// Same as local.ts — /api/ai-analyze on the main API when only VITE_API_BASE_URL is configured.
app.route("/api/ai-analyze", aiApp);

export const handler = handle(app);
