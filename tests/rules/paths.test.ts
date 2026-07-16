import { describe, expect, it } from "vitest";
import { isCatastrophicTarget, isSensitivePath } from "../../src/core/rules/paths";

describe("isCatastrophicTarget", () => {
  it("flags root, home, and critical system directories", () => {
    expect(isCatastrophicTarget("/")).toBe(true);
    expect(isCatastrophicTarget("~")).toBe(true);
    expect(isCatastrophicTarget("$HOME")).toBe(true);
    expect(isCatastrophicTarget("/etc")).toBe(true);
    expect(isCatastrophicTarget("/*")).toBe(true);
  });

  it("does not flag a scoped relative or project path", () => {
    expect(isCatastrophicTarget("./build")).toBe(false);
    expect(isCatastrophicTarget("/tmp/scratch")).toBe(false);
    expect(isCatastrophicTarget("node_modules")).toBe(false);
  });

  it("flags a critical root even with a trailing slash", () => {
    expect(isCatastrophicTarget("/etc/")).toBe(true);
    expect(isCatastrophicTarget("/home/")).toBe(true);
    expect(isCatastrophicTarget("~/")).toBe(true);
    expect(isCatastrophicTarget("$HOME/")).toBe(true);
    expect(isCatastrophicTarget("/")).toBe(true);
  });

  it("flags a critical root with redundant repeated trailing slashes", () => {
    expect(isCatastrophicTarget("/etc//")).toBe(true);
    expect(isCatastrophicTarget("//")).toBe(true);
  });
});

describe("isSensitivePath", () => {
  it("flags files under /etc and ~/.ssh, and known rc files", () => {
    expect(isSensitivePath("/etc/passwd")).toBe(true);
    expect(isSensitivePath("~/.ssh/authorized_keys")).toBe(true);
    expect(isSensitivePath("~/.bashrc")).toBe(true);
  });

  it("does not flag a path under the current or temp directory", () => {
    expect(isSensitivePath("./out.txt")).toBe(false);
    expect(isSensitivePath("/tmp/out.txt")).toBe(false);
  });
});
