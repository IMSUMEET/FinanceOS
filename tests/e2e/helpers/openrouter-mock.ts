import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";

const MOCK_PORT = Number(process.env.E2E_OPENROUTER_MOCK_PORT ?? 19999);

let server: Server | null = null;
const requestBodies: string[] = [];

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function mockOpenRouterResponse(prompt: string) {
  if (prompt.includes("transaction categorization engine")) {
    return {
      categorizedTransactions: [
        { id: "txn_001", aiCategory: "Food", aiConfidence: 0.92, reason: "grocery spend" },
        { id: "txn_002", aiCategory: "Income", aiConfidence: 0.95, reason: "payroll deposit" },
        { id: "txn_003", aiCategory: "Entertainment", aiConfidence: 0.88, reason: "streaming" },
      ],
    };
  }

  return {
    summary: "Playwright mock: spending looks manageable with steady income.",
    score: 82,
    riskLevel: "low",
    observations: [
      {
        title: "Food spend",
        message: "Groceries are the largest expense category.",
        severity: "info",
        category: "Food",
      },
    ],
    recommendations: [
      {
        title: "Review subscriptions",
        message: "Audit recurring entertainment charges.",
        impact: "medium",
        estimatedMonthlySavings: 20,
      },
    ],
    anomalies: [],
  };
}

async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  if (req.method === "GET" && req.url === "/__requests") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ count: requestBodies.length, bodies: requestBodies }));
    return;
  }

  if (req.method !== "POST") {
    res.writeHead(405);
    res.end();
    return;
  }

  const raw = await readBody(req);
  requestBodies.push(raw);

  let prompt = "";
  try {
    const parsed = JSON.parse(raw) as { messages?: { content?: string }[] };
    prompt = parsed.messages?.[0]?.content ?? "";
  } catch {
    prompt = "";
  }

  const payload = mockOpenRouterResponse(prompt);
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(payload) } }],
    }),
  );
}

export function getOpenRouterMockBaseUrl() {
  return `http://127.0.0.1:${MOCK_PORT}`;
}

export function getOpenRouterMockChatUrl() {
  return `${getOpenRouterMockBaseUrl()}/v1/chat/completions`;
}

export async function startOpenRouterMock() {
  if (server) return getOpenRouterMockChatUrl();

  requestBodies.length = 0;
  await new Promise<void>((resolve) => {
    server = createServer((req, res) => {
      void handleRequest(req, res);
    });
    server.listen(MOCK_PORT, "127.0.0.1", () => resolve());
  });

  return getOpenRouterMockChatUrl();
}

export async function stopOpenRouterMock() {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close((err) => (err ? reject(err) : resolve()));
  });
  server = null;
}

export async function fetchOpenRouterMockRequests() {
  const res = await fetch(`${getOpenRouterMockBaseUrl()}/__requests`);
  return res.json() as Promise<{ count: number; bodies: string[] }>;
}
