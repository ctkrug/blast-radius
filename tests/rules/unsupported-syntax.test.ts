import { describe, expect, it } from "vitest";
import { parseTokens } from "../../src/core/parser";
import { unsupportedSyntaxRule } from "../../src/core/rules/unsupported-syntax";
import { tokenize } from "../../src/core/tokenizer";

function firstCommand(source: string) {
  return parseTokens(tokenize(source)).parts[0].pipeline.stages[0];
}

describe("unsupportedSyntaxRule", () => {
  it("flags process substitution as a caution, not a silent safe", () => {
    const findings = unsupportedSyntaxRule(firstCommand("diff <(cmd1) <(cmd2)"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("caution");
    expect(findings[0].reason).toMatch(/couldn't fully analyze/i);
  });

  it("flags command substitution as a caution", () => {
    const findings = unsupportedSyntaxRule(firstCommand("echo $(whoami)"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("caution");
  });

  it("does not flag a fully-supported command", () => {
    const findings = unsupportedSyntaxRule(firstCommand("echo hello"));
    expect(findings).toHaveLength(0);
  });
});
