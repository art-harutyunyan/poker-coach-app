import { describe, expect, it } from "vitest";
import {
  formatMetricPercentage,
  metricDefinition,
  metricReasonLabel,
} from "./metricPresentation";

describe("metric presentation", () => {
  it("formats only the domain-provided percentage, including unavailable values", () => {
    expect(formatMetricPercentage(null)).toBe("—");
    expect(formatMetricPercentage(0)).toBe("0.0%");
    expect(formatMetricPercentage(23.94)).toBe("23.9%");
    expect(formatMetricPercentage(23.96)).toBe("24.0%");
  });

  it("keeps qualified showdown labels and denominator definitions", () => {
    expect(metricDefinition("threeBet").denominatorLabel).toBe("opportunities");
    expect(metricDefinition("wtsd").label).toBe("WTSD · source-confirmed");
    expect(metricDefinition("wtsd").definition).toMatch(/timed Hero SHOW/);
    expect(metricDefinition("wsd").label).toBe("W$SD · collected a share");
    expect(metricDefinition("wsd").definition).toMatch(/recorded share/);
  });

  it("renders all words of a multi-part exclusion reason", () => {
    expect(metricReasonLabel("missing_hero_reveal")).toBe("missing hero reveal");
  });
});
