export type OpenRouterOperation = "insights" | "categorization" | "coach_suggestions";

export type OpenRouterLogEvent =
  | "openrouter_start"
  | "openrouter_response"
  | "openrouter_success"
  | "openrouter_failure"
  | "openrouter_skipped";

function truncate(str: string, max = 400): string {
  if (!str) return "";
  const oneLine = str.replace(/\s+/g, " ").trim();
  return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}…`;
}

export function endpointLabel(url: string): string {
  return url.includes("openrouter.ai") ? "openrouter" : "custom";
}

export function logOpenRouter(event: OpenRouterLogEvent, data: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      event,
      service: "openrouter",
      ts: new Date().toISOString(),
      ...data,
    }),
  );
}

function extractUsage(resJson: unknown): Record<string, number> | undefined {
  const usage = (resJson as { usage?: Record<string, number> })?.usage;
  if (!usage || typeof usage !== "object") return undefined;
  return usage;
}

/** Log truncated OpenRouter HTTP response body for CloudWatch debugging. */
export function logOpenRouterResponse(
  operation: OpenRouterOperation,
  fields: {
    status: number;
    resJson?: unknown;
    content?: string;
    durationMs?: number;
  },
) {
  const content = fields.content ?? "";
  let parsedPreview: string | undefined;
  if (content) {
    try {
      parsedPreview = truncate(JSON.stringify(JSON.parse(content)), 1200);
    } catch {
      parsedPreview = undefined;
    }
  }

  logOpenRouter("openrouter_response", {
    operation,
    status: fields.status,
    durationMs: fields.durationMs,
    responseModel: (fields.resJson as { model?: string })?.model,
    responseId: (fields.resJson as { id?: string })?.id,
    contentLength: content.length,
    contentPreview: truncate(content, 1200),
    parsedPreview,
    usage: extractUsage(fields.resJson),
  });
}

export async function readOpenRouterErrorBody(res: Response): Promise<string> {
  try {
    return truncate(await res.text());
  } catch {
    return "";
  }
}

export function isOpenRouterTimeoutError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  return (err as { name?: string }).name === "AbortError";
}

export function openRouterErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
