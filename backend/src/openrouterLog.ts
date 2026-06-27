import {
  endpointLabel,
  errorMessage,
  isAbortError,
  Logger,
  readErrorBody,
  truncateForLog,
} from "@oblivion-labs-dev/arsenal-backend";

export type OpenRouterOperation = "insights" | "categorization" | "coach_suggestions";

export type OpenRouterLogEvent =
  | "openrouter_start"
  | "openrouter_response"
  | "openrouter_success"
  | "openrouter_failure"
  | "openrouter_skipped";

const openRouterLogger = new Logger({ service: "openrouter" });

export { endpointLabel };

export function logOpenRouter(event: OpenRouterLogEvent, data: Record<string, unknown>) {
  openRouterLogger.info(
    event,
    data as Record<string, import("@oblivion-labs-dev/arsenal-shared").JSONValue | undefined>,
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
      parsedPreview = truncateForLog(JSON.stringify(JSON.parse(content)), 1200);
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
    contentPreview: truncateForLog(content, 1200),
    parsedPreview,
    usage: extractUsage(fields.resJson),
  });
}

export async function readOpenRouterErrorBody(res: Response): Promise<string> {
  return readErrorBody(res);
}

export function isOpenRouterTimeoutError(err: unknown): boolean {
  return isAbortError(err);
}

export function openRouterErrorMessage(err: unknown): string {
  return errorMessage(err);
}
