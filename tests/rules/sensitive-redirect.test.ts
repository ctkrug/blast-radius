import { describe, expect, it } from "vitest";
import { parseTokens } from "../../src/core/parser";
import { sensitiveRedirectRule } from "../../src/core/rules/sensitive-redirect";
import { tokenize } from "../../src/core/tokenizer";

function firstCommand(source: string) {
  return parseTokens(tokenize(source)).parts[0].pipeline.stages[0];
}

describe("sensitiveRedirectRule", () => {
  it("flags overwriting /etc/passwd as danger, naming the file", () => {
    const findings = sensitiveRedirectRule(firstCommand("echo x > /etc/passwd"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("/etc/passwd");
  });

  it("flags appending to ~/.ssh/authorized_keys as danger", () => {
    const findings = sensitiveRedirectRule(firstCommand("echo key >> ~/.ssh/authorized_keys"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("~/.ssh/authorized_keys");
  });

  it("flags overwriting a shell rc file as danger", () => {
    const findings = sensitiveRedirectRule(firstCommand("echo x >> ~/.bashrc"));
    expect(findings[0].severity).toBe("danger");
  });

  it("does not flag a redirect into a temp or project path", () => {
    const findings = sensitiveRedirectRule(firstCommand("echo x > ./out.txt"));
    expect(findings).toHaveLength(0);
  });

  it("does not flag a read redirect", () => {
    const findings = sensitiveRedirectRule(firstCommand("cat < /etc/passwd"));
    expect(findings).toHaveLength(0);
  });

  it("does not flag a command with no redirects", () => {
    const findings = sensitiveRedirectRule(firstCommand("echo hello"));
    expect(findings).toHaveLength(0);
  });
});
