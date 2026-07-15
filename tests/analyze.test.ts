import { describe, expect, it } from "vitest";
import { analyze } from "../src/core/analyze";

describe("analyze", () => {
  it("returns no findings for an empty command", () => {
    const verdict = analyze("");
    expect(verdict.overall).toBe("safe");
    expect(verdict.findings).toHaveLength(0);
  });

  it("returns no findings for a harmless command", () => {
    const verdict = analyze("echo hello");
    expect(verdict.overall).toBe("safe");
    expect(verdict.findings).toHaveLength(0);
  });

  it("flags a command that uses sudo", () => {
    const verdict = analyze("sudo apt update");
    expect(verdict.overall).toBe("caution");
    expect(verdict.findings[0].reason).toMatch(/root/i);
  });
});
