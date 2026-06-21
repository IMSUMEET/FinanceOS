import { describe, expect, it } from "vitest";
import {
  parseAnalysisInsights,
  recommendationImpactTone,
  observationSeverityTone,
  topAiRecommendations,
  topAiAnomalies,
  insightSourceLabel,
} from "./analysisInsights.js";

describe("parseAnalysisInsights", () => {
  it("returns null when analysis has no insights", () => {
    expect(parseAnalysisInsights(null)).toBeNull();
    expect(parseAnalysisInsights({ status: "success" })).toBeNull();
  });

  it("normalizes Lambda insights payload", () => {
    const parsed = parseAnalysisInsights({
      status: "success",
      mode: "local-categorization-static-suggestions",
      aiStatus: { insights: "static" },
      insights: {
        summary: "You saved 12%.",
        score: 72,
        riskLevel: "medium",
        observations: [{ title: "Food", message: "High spend", severity: "warning" }],
        recommendations: [
          {
            title: "Trim food",
            message: "Cook more at home.",
            impact: "high",
            estimatedMonthlySavings: 120,
          },
        ],
        anomalies: [{ title: "Large expense", message: "One big charge." }],
      },
    });

    expect(parsed.summary).toBe("You saved 12%.");
    expect(parsed.score).toBe(72);
    expect(parsed.recommendations).toHaveLength(1);
    expect(parsed.source).toBe("static");
    expect(parsed.anomalies).toHaveLength(1);
  });
});

describe("topAiAnomalies", () => {
  it("returns at most two anomalies", () => {
    const items = [{ title: "A" }, { title: "B" }, { title: "C" }];
    expect(topAiAnomalies(items)).toHaveLength(2);
    expect(topAiAnomalies(items)[1].title).toBe("B");
  });
});

describe("insightSourceLabel", () => {
  it("maps aiStatus insight source values", () => {
    expect(insightSourceLabel("openrouter")).toContain("OpenRouter");
    expect(insightSourceLabel("static")).toContain("Lambda");
    expect(insightSourceLabel("fallback")).toContain("fallback");
  });
});

describe("topAiRecommendations", () => {
  it("returns at most three recommendations", () => {
    const recs = [
      { title: "A" },
      { title: "B" },
      { title: "C" },
      { title: "D" },
    ];
    expect(topAiRecommendations(recs)).toHaveLength(3);
    expect(topAiRecommendations(recs)[2].title).toBe("C");
  });
});

describe("analysisInsights tone helpers", () => {
  it("maps impact and severity to tone classes", () => {
    expect(recommendationImpactTone("high")).toContain("emerald");
    expect(recommendationImpactTone("low")).toContain("ink");
    expect(observationSeverityTone("warning")).toBe("warn");
    expect(observationSeverityTone("critical")).toBe("danger");
  });
});
