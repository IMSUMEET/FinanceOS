import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./index.js";
import { aiApp } from "./aiAnalyzer.js";

// Mount Lambda 2 under /api/ai-analyze for local testing
app.route("/api/ai-analyze", aiApp);

serve({
  fetch: app.fetch,
  port: 3001,
});

console.log("Finance OS API running on http://localhost:3001");
