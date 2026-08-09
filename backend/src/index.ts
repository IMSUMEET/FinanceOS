import { Hono } from "hono";
import { analyzeCsvBuffers, MAX_CSV_BYTES, isCsvFileName } from "./csvAnalyze.js";
import {
  buildReportData,
  generateCoachSuggestionsWithOpenRouter,
  generateStaticInsights,
  mapToAllowedCategory,
} from "./openrouter.js";
import { PlaidService } from "./services/plaid/plaidService.js";
import { PlaidStore } from "./services/plaid/plaidStore.js";
import { getPlaidConfig } from "./services/plaid/plaidClient.js";

export const app = new Hono();

app.get("/", (c) => {
  return c.json({
    ok: true,
    service: "finance-os-api",
    hint: "POST /api/analyze (multipart CSV) or GET /health.",
  });
});

app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

function collectUploadFiles(body: Record<string, unknown>): File[] {
  const files: File[] = [];
  for (const v of Object.values(body)) {
    if (v instanceof File) {
      files.push(v);
      continue;
    }
    if (Array.isArray(v)) {
      for (const item of v) {
        if (item instanceof File) files.push(item);
      }
    }
  }
  return files;
}

function csvMimeOk(mime: string): boolean {
  if (!mime) return true;
  const m = mime.toLowerCase();
  if (m === "application/octet-stream") return true;
  if (
    m === "application/csv" ||
    m === "application/vnd.ms-excel" ||
    m === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  )
    return true;
  if (m.startsWith("text/")) return true;
  return false;
}

app.post("/api/analyze", async (c) => {
  const contentType = c.req.header("content-type") ?? "";
  if (!contentType.toLowerCase().includes("multipart/form-data")) {
    return c.json(
      {
        status: "error",
        message: "Expected multipart/form-data.",
        code: "INVALID_CONTENT_TYPE",
      },
      400,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await c.req.parseBody({ all: true })) as Record<string, unknown>;
  } catch {
    return c.json(
      {
        status: "error",
        message: "Could not read upload. Try a smaller file or fewer files at once.",
        code: "MULTIPART_READ_FAILED",
      },
      400,
    );
  }

  const files = collectUploadFiles(body);
  if (!files.length) {
    return c.json(
      {
        status: "error",
        message: 'No files found. Append files with the field name "files".',
        code: "MISSING_FILES",
      },
      400,
    );
  }

  for (const f of files) {
    const name = f.name || "upload";
    if (!isCsvFileName(name)) {
      return c.json(
        {
          status: "error",
          message: "Only .csv, .xlsx, or .xls files are accepted.",
          code: "INVALID_FILE_TYPE",
        },
        400,
      );
    }
    if (!csvMimeOk(f.type ?? "")) {
      return c.json(
        {
          status: "error",
          message: "Each part must be a CSV or Excel file.",
          code: "INVALID_FILE_TYPE",
        },
        400,
      );
    }
    if (f.size > MAX_CSV_BYTES) {
      return c.json(
        {
          status: "error",
          message: "Each file must be 5 MB or smaller.",
          code: "FILE_TOO_LARGE",
        },
        413,
      );
    }
  }

  const totalBytes = files.reduce((s, f) => s + f.size, 0);

  try {
    const buffers = await Promise.all(
      files.map(async (f) => ({
        name: f.name || "upload.csv",
        buffer: await f.arrayBuffer(),
      })),
    );

    const result = await analyzeCsvBuffers(buffers);
    const mappedTransactions = result.transactions.map((t: any) => {
      const allowedCat = mapToAllowedCategory(t.category);
      const isIncome = t.amount > 0;
      return {
        id: `txn_${String(t.id).padStart(3, "0")}`,
        date: t.date,
        description: t.description || t.merchant_raw || "Unknown",
        merchant: t.merchant_normalized || "Unknown",
        amount: Number(t.amount || 0),
        type: isIncome ? "income" : "expense",
        localCategory: allowedCat,
        localConfidence: t.category === "Other" ? 0.5 : 0.9,
        finalCategory: allowedCat,
        categorySource: "local",

        // backwards compatibility fields
        merchant_raw: t.merchant_raw || t.description || "Unknown",
        merchant_normalized: t.merchant_normalized || "Unknown",
        currency: t.currency || "USD",
        category: allowedCat,
        source: t.source || "csv-analyze",
        card_identity: t.card_identity || "Unknown",
        created_at: t.created_at || new Date().toISOString(),
      };
    });

    const reportData = buildReportData(mappedTransactions);
    const insights = generateStaticInsights(reportData);

    console.log(
      JSON.stringify({
        event: "analyze",
        fileCount: files.length,
        totalBytes,
        transactionCount: result.transactions.length,
        outcome: "success",
        openrouterConfigured: !!process.env.OPENROUTER_API_KEY,
        aiStatus: {
          insights: "static",
        },
      }),
    );

    return c.json({
      status: "success",
      mode: "local-categorization-static-suggestions",
      transactions: mappedTransactions,
      reportData,
      insights,
      aiStatus: "static",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    console.log(
      JSON.stringify({
        event: "analyze",
        fileCount: files.length,
        totalBytes,
        outcome: "failure",
        errorCode: msg.startsWith("CSV_PARSE_ERROR") ? "CSV_PARSE_ERROR" : "ANALYZE_FAILED",
      }),
    );
    if (msg.startsWith("CSV_PARSE_ERROR")) {
      return c.json(
        {
          status: "error",
          message: "A CSV could not be parsed. Check delimiter and headers.",
          code: "CSV_PARSE_ERROR",
        },
        400,
      );
    }
    return c.json(
      {
        status: "error",
        message: "Analysis failed. Try again with a different export.",
        code: "ANALYZE_FAILED",
      },
      500,
    );
  }
});

app.post("/api/coach/suggestions", async (c) => {
  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ status: "error", message: "Expected JSON body.", code: "INVALID_JSON" }, 400);
  }

  const summary = body.summary;
  if (!summary || typeof summary !== "object") {
    return c.json(
      { status: "error", message: "Missing summary object.", code: "MISSING_SUMMARY" },
      400,
    );
  }

  const hasApiKey = !!process.env.OPENROUTER_API_KEY;
  const result = await generateCoachSuggestionsWithOpenRouter(summary as any);

  console.log(
    JSON.stringify({
      event: "coach-suggestions",
      transactionCount: (summary as any).totalTransactions ?? 0,
      outcome: "success",
      openrouterConfigured: hasApiKey,
      source: result.source,
    }),
  );

  return c.json({
    status: "success",
    suggestions: result.suggestions,
    fullInsights: (result as any).fullInsights || null,
    source: result.source,
  });
});

app.post("/api/ai/categorize", async (c) => {
  let body: { transactions?: any[] };
  try {
    body = (await c.req.json()) as { transactions?: any[] };
  } catch {
    return c.json({ status: "error", message: "Expected JSON body.", code: "INVALID_JSON" }, 400);
  }

  const transactions = body.transactions;
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return c.json(
      { status: "error", message: "Missing transactions array.", code: "MISSING_TRANSACTIONS" },
      400,
    );
  }

  const { generateBatchCategorizationWithQwen } = await import("./openrouter.js");
  const proposals = await generateBatchCategorizationWithQwen(transactions);

  return c.json({
    status: "success",
    proposals,
  });
});

/* ==========================================================================
   Plaid Integration Endpoints
   ========================================================================== */

// GET /api/plaid/config — Public configuration status check
app.get("/api/plaid/config", (c) => {
  const config = getPlaidConfig();
  return c.json({
    status: "success",
    isConfigured: config.isConfigured,
    environment: config.env,
  });
});

// POST /api/plaid/link-token — Create Link Token for frontend Link modal
app.post("/api/plaid/link-token", async (c) => {
  let connectionId: string | undefined;
  try {
    const body = (await c.req.json()) as Record<string, unknown>;
    if (typeof body?.connectionId === "string") {
      connectionId = body.connectionId;
    }
  } catch {
    /* JSON body is optional */
  }

  try {
    const result = await PlaidService.createLinkToken(connectionId);
    return c.json({
      status: "success",
      link_token: result.linkToken,
      expiration: result.expiration,
    });
  } catch (err: any) {
    return c.json(
      {
        status: "error",
        message: err.message || "Failed to create Link token.",
        code: "PLAID_LINK_TOKEN_FAILED",
      },
      500,
    );
  }
});

// POST /api/plaid/exchange-token — Exchange public token & establish connection
app.post("/api/plaid/exchange-token", async (c) => {
  let body: { public_token?: string; metadata?: any };
  try {
    body = (await c.req.json()) as { public_token?: string; metadata?: any };
  } catch {
    return c.json({ status: "error", message: "Expected JSON body.", code: "INVALID_JSON" }, 400);
  }

  if (!body.public_token) {
    return c.json(
      { status: "error", message: "Missing public_token.", code: "MISSING_PUBLIC_TOKEN" },
      400,
    );
  }

  try {
    const connection = await PlaidService.exchangePublicToken(body.public_token, body.metadata);
    return c.json({
      status: "success",
      connection,
    });
  } catch (err: any) {
    return c.json(
      {
        status: "error",
        message: err.message || "Failed to exchange public token.",
        code: "PLAID_EXCHANGE_FAILED",
      },
      500,
    );
  }
});

// GET /api/plaid/connections — List all saved connections & accounts
app.get("/api/plaid/connections", (c) => {
  const connections = PlaidStore.getSafeConnections();
  const accounts = PlaidStore.getAccounts();
  return c.json({
    status: "success",
    connections,
    accounts,
  });
});

// GET /api/plaid/transactions — Get all stored real Plaid transactions across all connections
app.get("/api/plaid/transactions", (c) => {
  const transactions = PlaidStore.getTransactions();
  return c.json({
    status: "success",
    transactions,
  });
});

// POST /api/plaid/connections/:id/sync — Incremental transaction sync & balance refresh
app.post("/api/plaid/connections/:id/sync", async (c) => {
  const connectionId = c.req.param("id");
  const resetCursor = c.req.query("resetCursor") === "true";
  try {
    const result = await PlaidService.syncTransactions(connectionId, { resetCursor });
    return c.json({
      status: "success",
      added: result.added,
      modified: result.modified,
      removed: result.removed,
      allStored: result.allStored,
      totalAddedCount: result.totalAddedCount,
      accounts: result.accounts,
    });
  } catch (err: any) {
    const isLoginRequired = err.message === "ITEM_LOGIN_REQUIRED";
    return c.json(
      {
        status: "error",
        message: isLoginRequired
          ? "Bank login required. Please reconnect your institution."
          : err.message || "Failed to sync transactions.",
        code: isLoginRequired ? "ITEM_LOGIN_REQUIRED" : "PLAID_SYNC_FAILED",
      },
      isLoginRequired ? 401 : 500,
    );
  }
});

// POST /api/plaid/connections/:id/update-link-token — Link token for update/reconnect mode
app.post("/api/plaid/connections/:id/update-link-token", async (c) => {
  const connectionId = c.req.param("id");
  try {
    const result = await PlaidService.createLinkToken(connectionId);
    return c.json({
      status: "success",
      link_token: result.linkToken,
      expiration: result.expiration,
    });
  } catch (err: any) {
    return c.json(
      {
        status: "error",
        message: err.message || "Failed to create update Link token.",
        code: "PLAID_UPDATE_LINK_FAILED",
      },
      500,
    );
  }
});

// DELETE /api/plaid/connections/:id — Disconnect institution and remove local item
app.delete("/api/plaid/connections/:id", async (c) => {
  const connectionId = c.req.param("id");
  try {
    const removed = await PlaidService.removeConnection(connectionId);
    if (!removed) {
      return c.json({ status: "error", message: "Connection not found.", code: "NOT_FOUND" }, 404);
    }
    return c.json({
      status: "success",
      message: "Connection removed successfully.",
    });
  } catch (err: any) {
    return c.json(
      {
        status: "error",
        message: err.message || "Failed to remove connection.",
        code: "PLAID_REMOVE_FAILED",
      },
      500,
    );
  }
});
