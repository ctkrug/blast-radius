import { describe, expect, it } from "vitest";
import { analyze } from "../src/core/analyze";

describe("analyze", () => {
  it("returns no findings for an empty command", () => {
    const verdict = analyze("");
    expect(verdict.overall).toBe("safe");
    expect(verdict.findings).toHaveLength(0);
  });

  it("returns no findings for a comment-only command", () => {
    const verdict = analyze("# just a comment");
    expect(verdict.overall).toBe("safe");
    expect(verdict.findings).toHaveLength(0);
  });

  it("returns no findings for a harmless command", () => {
    const verdict = analyze("echo hello");
    expect(verdict.overall).toBe("safe");
    expect(verdict.findings).toHaveLength(0);
  });

  it("surfaces an unterminated quote as a caution finding, not a crash", () => {
    const verdict = analyze("echo 'unterminated");
    expect(verdict.overall).toBe("caution");
    expect(verdict.findings).toHaveLength(1);
    expect(verdict.parseError).toBeDefined();
  });

  it("analyzes a 200-token script in under 50ms", () => {
    const script = Array.from({ length: 100 }, (_, i) => `echo arg${i}`).join(" && ");
    const start = performance.now();
    analyze(script);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
