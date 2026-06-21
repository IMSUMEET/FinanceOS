import { describe, it, expect, vi, afterEach } from "vitest";
import {
  endpointLabel,
  isOpenRouterTimeoutError,
  logOpenRouterResponse,
  openRouterErrorMessage,
  readOpenRouterErrorBody,
} from "../src/openrouterLog.js";

describe("openrouterLog helpers", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("labels openrouter endpoints", () => {
    expect(endpointLabel("https://openrouter.ai/api/v1/chat/completions")).toBe("openrouter");
    expect(endpointLabel("https://example.com/v1")).toBe("custom");
  });

  it("detects abort timeout errors", () => {
    expect(isOpenRouterTimeoutError({ name: "AbortError" })).toBe(true);
    expect(isOpenRouterTimeoutError(new Error("fail"))).toBe(false);
  });

  it("formats unknown errors", () => {
    expect(openRouterErrorMessage(new Error("boom"))).toBe("boom");
    expect(openRouterErrorMessage("plain")).toBe("plain");
  });

  it("truncates error response bodies", async () => {
    const res = new Response("x".repeat(500));
    const body = await readOpenRouterErrorBody(res);
    expect(body.length).toBeLessThanOrEqual(401);
  });

  it("logs openrouter response previews", () => {
    const spy = vi.spyOn(console, "log").mockImplementation(() => {});
    logOpenRouterResponse("insights", {
      status: 200,
      resJson: {
        id: "gen-123",
        model: "openrouter/free",
        usage: { prompt_tokens: 10, completion_tokens: 20, total_tokens: 30 },
        choices: [{ message: { content: '{"summary":"ok","score":90}' } }],
      },
      content: '{"summary":"ok","score":90}',
      durationMs: 1200,
    });

    expect(spy).toHaveBeenCalledOnce();
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.event).toBe("openrouter_response");
    expect(payload.operation).toBe("insights");
    expect(payload.responseId).toBe("gen-123");
    expect(payload.contentPreview).toContain("summary");
    expect(payload.parsedPreview).toContain("score");
    expect(payload.usage?.total_tokens).toBe(30);
  });
});
