import { describe, expect, it } from "vitest";
import { parseTokens } from "../../src/core/parser";
import { destructiveFsRule } from "../../src/core/rules/destructive-fs";
import { tokenize } from "../../src/core/tokenizer";

function firstCommand(source: string) {
  return parseTokens(tokenize(source)).parts[0].pipeline.stages[0];
}

describe("destructiveFsRule", () => {
  it("flags rm -rf / as danger, naming the deleted path", () => {
    const findings = destructiveFsRule(firstCommand("rm -rf /"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("/");
  });

  it("flags rm -rf ~ as danger", () => {
    const findings = destructiveFsRule(firstCommand("rm -rf ~"));
    expect(findings[0].severity).toBe("danger");
  });

  it("flags rm -rf ./build as caution at most", () => {
    const findings = destructiveFsRule(firstCommand("rm -rf ./build"));
    expect(findings).toHaveLength(1);
    expect(findings[0].severity).toBe("caution");
  });

  it("does not flag a non-recursive rm", () => {
    const findings = destructiveFsRule(firstCommand("rm file.txt"));
    expect(findings).toHaveLength(0);
  });

  it("does not flag an unrelated command", () => {
    const findings = destructiveFsRule(firstCommand("echo hello"));
    expect(findings).toHaveLength(0);
  });

  it("flags mkfs as danger", () => {
    const findings = destructiveFsRule(firstCommand("mkfs.ext4 /dev/sdb1"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("/dev/sdb1");
  });

  it("flags dd writing to a raw device as danger", () => {
    const findings = destructiveFsRule(firstCommand("dd if=file.img of=/dev/sda"));
    expect(findings[0].severity).toBe("danger");
    expect(findings[0].reason).toContain("/dev/sda");
  });

  it("does not flag dd writing to a regular file", () => {
    const findings = destructiveFsRule(firstCommand("dd if=file.img of=backup.img"));
    expect(findings).toHaveLength(0);
  });
});
