import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import Papa from "papaparse";
import { categorize, normalizeMerchant } from "./categorize.js";
import {
  buildReportData,
  generateInsightsWithOpenRouter,
  fallbackInsights,
  mapToAllowedCategory,
  safeJsonParse,
  OPENROUTER_CHAT_COMPLETIONS_URL,
} from "./openrouter.js";
import {
  endpointLabel,
  isOpenRouterTimeoutError,
  logOpenRouter,
  openRouterErrorMessage,
  readOpenRouterErrorBody,
} from "./openrouterLog.js";

export const aiApp = new Hono();

// Custom CORS middleware for standalone Lambda 2
aiApp.use("*", async (c, next) => {
  await next();
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Headers", "content-type, authorization, accept");
  c.header("Access-Control-Allow-Methods", "POST,OPTIONS");
});

aiApp.options("*", (c) => {
  return c.text("ok", 200);
});

// Helper: parse CSV string to transactions list
export function parseCsvToTransactions(csvText: string): any[] {
  const result = Papa.parse<Record<string, unknown>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const rows = result.data || [];
  if (!rows.length) return [];

  const headers = Object.keys(rows[0]!);
  const lcHeaders = headers.map((h) => String(h).toLowerCase().trim());

  const getCol = (hints: string[]) => {
    for (const hint of hints) {
      const idx = lcHeaders.findIndex((h) => h === hint);
      if (idx !== -1) return headers[idx]!;
    }
    for (const hint of hints) {
      const idx = lcHeaders.findIndex((h) => h.includes(hint));
      if (idx !== -1) return headers[idx]!;
    }
    return headers[0]!;
  };

  const dateCol = getCol(["date", "transaction date", "posted date", "trans date"]);
  const descCol = getCol(["description", "merchant", "name", "details"]);
  const amtCol = getCol(["amount", "transaction amount", "value", "debit", "credit"]);

  const debitCol = headers.find((h) => h.toLowerCase().trim() === "debit");
  const creditCol = headers.find((h) => h.toLowerCase().trim() === "credit");

  const cleaned: any[] = [];
  let nextId = 1;

  rows.forEach((r) => {
    // Skip completely empty rows
    if (Object.values(r).every((v) => v === null || v === undefined || v === "")) {
      return;
    }

    const dateStr = String(r[dateCol] || "").trim();
    if (!dateStr) return;

    let amount = 0;
    if (debitCol || creditCol) {
      const dbVal = debitCol ? r[debitCol] : null;
      const crVal = creditCol ? r[creditCol] : null;
      const dNum = dbVal ? Number(String(dbVal).replace(/[$,]/g, "")) : 0;
      const cNum = crVal ? Number(String(crVal).replace(/[$,]/g, "")) : 0;
      if (cNum !== 0 && !isNaN(cNum)) {
        amount = cNum;
      } else if (dNum !== 0 && !isNaN(dNum)) {
        amount = -Math.abs(dNum);
      }
    } else {
      const rawAmt = r[amtCol];
      amount = Number(String(rawAmt || "").replace(/[$,]/g, ""));
      if (isNaN(amount)) amount = 0;
    }

    const rawDesc = String(r[descCol] || "").trim();
    const merchant = normalizeMerchant(rawDesc);

    cleaned.push({
      id: `txn_${String(nextId++).padStart(3, "0")}`,
      date: dateStr,
      description: rawDesc,
      merchant,
      amount,
      type: amount > 0 ? "income" : "expense",
    });
  });

  return cleaned;
}

export function getLocalCategoryHint(transaction: any) {
  const cat = categorize(transaction.merchant, transaction.description);
  let allowed = mapToAllowedCategory(cat);

  if (allowed === "Other") {
    const rawText = `${transaction.merchant || ""} ${transaction.description || ""}`.toLowerCase();
    if (rawText.includes("payroll") || rawText.includes("salary") || rawText.includes("paycheck")) {
      allowed = "Income";
    } else if (rawText.includes("rent") || rawText.includes("mortgage") || rawText.includes("housing")) {
      allowed = "Housing";
    } else if (rawText.includes("zelle") || rawText.includes("venmo") || rawText.includes("transfer") || rawText.includes("wire")) {
      allowed = "Transfers";
    }
  }

  const confidence = allowed === "Other" ? 0.5 : 0.9;
  return {
    category: allowed,
    confidence,
  };
}

// OpenRouter categorization batch call
export async function categorizeTransactionsWithOpenRouter(transactions: any[]): Promise<any[]> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || "openrouter/free";
  const appUrl = process.env.APP_URL || "https://financeos.app";

  if (!apiKey) {
    logOpenRouter("openrouter_skipped", {
      operation: "categorization",
      reason: "missing_api_key",
      model,
      batchSize: transactions.length,
      outcome: "fallback",
    });
    return [];
  }

  logOpenRouter("openrouter_start", {
    operation: "categorization",
    model,
    endpoint: endpointLabel(OPENROUTER_CHAT_COMPLETIONS_URL),
    batchSize: transactions.length,
  });

  const startedAt = Date.now();
  const failCategorization = (fields: Record<string, unknown>) => {
    logOpenRouter("openrouter_failure", {
      operation: "categorization",
      model,
      batchSize: transactions.length,
      durationMs: Date.now() - startedAt,
      outcome: "fallback",
      ...fields,
    });
    return [] as any[];
  };

  const prompt = `You are a transaction categorization engine for FinanceOS.

Return ONLY valid JSON. No markdown. No explanation.

Allowed categories:
[
  "Income",
  "Housing",
  "Food",
  "Transportation",
  "Shopping",
  "Bills & Utilities",
  "Health",
  "Entertainment",
  "Transfers",
  "Other"
]

Rules:
- Choose exactly one category from the allowed categories.
- Do not create new categories.
- Use merchant, description, amount, type, localCategory, and localConfidence.
- If transaction type is income and it looks like payroll, salary, refund, interest, cashback, or deposit, use "Income".
- If transaction appears to be movement between accounts, credit card payment, ACH payment, Venmo, Zelle, Cash App, PayPal transfer, or internal transfer, use "Transfers".
- If it is a rent, mortgage, apartment, property management, or housing-related payment, use "Housing".
- If it is grocery, restaurant, coffee, delivery, or food-related, use "Food".
- If it is gas, rideshare, parking, toll, transit, car maintenance, or public transport, use "Transportation".
- If it is retail or ecommerce, use "Shopping".
- If it is internet, phone, electricity, water, garbage, insurance bill, or utility bill, use "Bills & Utilities".
- If it is pharmacy, doctor, dentist, hospital, clinic, medical, or wellness-related, use "Health".
- If it is streaming, gaming, movies, events, hobbies, or leisure, use "Entertainment".
- If unsure, use "Other".
- Confidence must be a number between 0 and 1.
- Keep reason short.
- Return one result for every input transaction.

Return schema:
{
  "categorizedTransactions": [
    {
      "id": "string",
      "aiCategory": "Income | Housing | Food | Transportation | Shopping | Bills & Utilities | Health | Entertainment | Transfers | Other",
      "aiConfidence": 0.95,
      "reason": "short reason"
    }
  ]
}

Transactions:
${JSON.stringify(
  transactions.map((t) => ({
    id: t.id,
    date: t.date,
    description: t.description,
    merchant: t.merchant,
    amount: t.amount,
    type: t.type,
    localCategory: t.localCategory,
    localConfidence: t.localConfidence,
  })),
  null,
  2
)}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(OPENROUTER_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": appUrl,
        "X-OpenRouter-Title": "FinanceOS",
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorBody = await readOpenRouterErrorBody(res);
      return failCategorization({
        status: res.status,
        error: `HTTP ${res.status}`,
        errorBody: errorBody || undefined,
      });
    }

    const resJson: any = await res.json();
    const content = resJson?.choices?.[0]?.message?.content;
    if (!content) {
      return failCategorization({ status: res.status, error: "empty_response" });
    }

    const parsed = safeJsonParse(content);
    const categorized = parsed?.categorizedTransactions || [];
    if (!categorized.length) {
      return failCategorization({
        status: res.status,
        error: "no_categorized_transactions",
        contentLength: content.length,
      });
    }

    logOpenRouter("openrouter_success", {
      operation: "categorization",
      model,
      status: res.status,
      durationMs: Date.now() - startedAt,
      batchSize: transactions.length,
      resultCount: categorized.length,
      outcome: "success",
    });
    return categorized;
  } catch (e: unknown) {
    clearTimeout(timeoutId);
    return failCategorization({
      error: openRouterErrorMessage(e),
      timedOut: isOpenRouterTimeoutError(e),
    });
  }
}

export function mergeAiCategories(transactions: any[], aiResults: any[]): any[] {
  const aiMap = new Map<string, any>();
  aiResults.forEach((r) => {
    if (r && r.id) aiMap.set(r.id, r);
  });

  const allowedCategories = [
    "Income",
    "Housing",
    "Food",
    "Transportation",
    "Shopping",
    "Bills & Utilities",
    "Health",
    "Entertainment",
    "Transfers",
    "Other"
  ];

  return transactions.map((t) => {
    const aiRes = aiMap.get(t.id);
    const aiCategory = aiRes?.aiCategory && allowedCategories.includes(aiRes.aiCategory) ? aiRes.aiCategory : null;
    const aiConfidence = typeof aiRes?.aiConfidence === "number" ? aiRes.aiConfidence : 0;

    let finalCategory = "Other";
    let categorySource = "fallback";

    if (aiCategory && aiConfidence >= 0.65) {
      finalCategory = aiCategory;
      categorySource = "ai";
    } else if (t.localConfidence >= 0.7) {
      finalCategory = t.localCategory;
      categorySource = "local";
    }

    return {
      ...t,
      aiCategory: aiCategory || "Other",
      aiConfidence,
      finalCategory,
      categorySource,

      // backwards compatibility fields for frontend UI
      merchant_raw: t.description,
      merchant_normalized: t.merchant,
      currency: "USD",
      category: finalCategory,
      source: "csv-analyze",
      card_identity: "Unknown",
      created_at: new Date(`${t.date}T12:00:00Z`).toISOString()
    };
  });
}

async function handleAiAnalyzeRequest(c: any) {
  let csvText = "";

  // 1. Accept uploaded CSV
  try {
    const contentType = c.req.header("content-type") || "";

    if (contentType.toLowerCase().includes("application/json")) {
      const body = await c.req.json();
      csvText = body.csv || "";
    } else if (contentType.toLowerCase().includes("multipart/form-data")) {
      const body = await c.req.parseBody();
      // Look for the "files" or "file" field
      const file = body.files || body.file;
      if (file instanceof File) {
        csvText = await file.text();
      } else if (typeof file === "string") {
        csvText = file;
      }
    } else {
      csvText = await c.req.text();
    }

    // Support base64 encoded body from API Gateway
    const rawBody: any = c.req.raw;
    /* v8 ignore next 3 -- API Gateway base64 payloads are environment-specific */
    if (rawBody && rawBody.isBase64Encoded) {
      csvText = Buffer.from(csvText, "base64").toString("utf-8");
    }
  } catch (e) {
    return c.json({ status: "error", message: "Failed to read CSV input payload" }, 400);
  }

  if (!csvText.trim()) {
    return c.json({ status: "error", message: "Empty CSV content" }, 400);
  }

  // 2. Parse CSV
  let rawTransactions = parseCsvToTransactions(csvText);
  if (!rawTransactions.length) {
    return c.json({ status: "error", message: "No valid transactions parsed from CSV" }, 400);
  }

  // 3. Local category hints
  const transactionsWithHints = rawTransactions.map((t) => {
    const hint = getLocalCategoryHint(t);
    return {
      ...t,
      localCategory: hint.category,
      localConfidence: hint.confidence,
    };
  });

  // 4. Batch LLM categorization
  let aiStatusCategorization = "success";
  let aiResults: any[] = [];
  const hasApiKey = !!process.env.OPENROUTER_API_KEY;

  if (hasApiKey) {
    // Process in batches of 40
    const batchSize = 40;
    for (let i = 0; i < transactionsWithHints.length; i += batchSize) {
      const batch = transactionsWithHints.slice(i, i + batchSize);
      const batchResults = await categorizeTransactionsWithOpenRouter(batch);
      aiResults.push(...batchResults);
    }
    if (aiResults.length === 0) {
      aiStatusCategorization = "fallback";
    }
  } else {
    aiStatusCategorization = "fallback";
  }

  // 5. Merge categories
  const finalTransactions = mergeAiCategories(transactionsWithHints, aiResults);

  // 6. Build reportData
  const reportData = buildReportData(finalTransactions);

  // 7. Generate insights
  const insights = await generateInsightsWithOpenRouter(reportData);
  const aiStatusInsights = hasApiKey && !insights.summary.startsWith("You had $") ? "success" : "fallback";

  console.log(
    JSON.stringify({
      event: "ai-analyze",
      transactionCount: rawTransactions.length,
      outcome: "success",
      openrouterConfigured: hasApiKey,
      aiStatus: {
        categorization: aiStatusCategorization,
        insights: aiStatusInsights,
      },
    }),
  );

  return c.json({
    status: "success",
    mode: "ai-categorization-ai-suggestions",
    transactions: finalTransactions,
    reportData,
    insights,
    aiStatus: {
      categorization: aiStatusCategorization,
      insights: aiStatusInsights,
    },
  });
}

aiApp.post("/", handleAiAnalyzeRequest);
aiApp.post("/api/ai-analyze", handleAiAnalyzeRequest);

/* v8 ignore next -- AWS Lambda adapter entrypoint */
export const handler = handle(aiApp);
