import { describe, expect, it } from "vitest";
import { parseTokens } from "../../src/core/parser";
import { sudoScopeRule } from "../../src/core/rules/sudo-scope";
import { tokenize } from "../../src/core/tokenizer";

function firstCommand(source: string) {
  return parseTokens(tokenize(source)).parts[0].pipeline.stages[0];
}

describe("sudoScopeRule", () => {
  it("flags sudo apt update as caution", () => {
    const findings = sudoScopeRule(firstCommand("sudo apt update"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("caution");
  });

  it("compounds sudo rm -rf / to danger", () => {
    const findings = sudoScopeRule(firstCommand("sudo rm -rf /"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("danger");
  });

  it("shows no root-related finding for a command with no sudo", () => {
    const findings = sudoScopeRule(firstCommand("echo hello"));
    expect(findings).toHaveLength(0);
  });

  it("flags an unrecognized sudo'd command as a generic root caution", () => {
    const findings = sudoScopeRule(firstCommand("sudo mytool --deploy"));
    expect(findings[0].severity).toBe("caution");
    expect(findings[0].reason).toMatch(/root/i);
  });

  it("compounds sudo -u root rm -rf / to danger, skipping the -u value", () => {
    const findings = sudoScopeRule(firstCommand("sudo -u root rm -rf /"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("danger");
  });

  it("compounds sudo -u <user> rm -rf /etc to danger for a non-root target user", () => {
    const findings = sudoScopeRule(firstCommand("sudo -u www-data rm -rf /etc"));
    expect(findings[0].severity).toBe("danger");
  });
});
