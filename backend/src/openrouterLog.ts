export type OpenRouterOperation = "insights" | "categorization";

export type OpenRouterLogEvent =
  | "openrouter_start"
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
