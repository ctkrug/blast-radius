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

  it("flags a wildcard that wipes everything inside a critical root or home", () => {
    expect(isCatastrophicTarget("/etc/*")).toBe(true);
    expect(isCatastrophicTarget("/home/*")).toBe(true);
    expect(isCatastrophicTarget("~/*")).toBe(true);
  });

  it("does not flag a wildcard scoped to a non-critical directory", () => {
    expect(isCatastrophicTarget("/tmp/*")).toBe(false);
    expect(isCatastrophicTarget("./build/*")).toBe(false);
  });

  it("flags a specific user's entire home directory, same as /root", () => {
    expect(isCatastrophicTarget("/home/alice")).toBe(true);
    expect(isCatastrophicTarget("/home/alice/")).toBe(true);
  });

  it("does not flag a scoped subdirectory within a user's home", () => {
    expect(isCatastrophicTarget("/home/alice/tmp")).toBe(false);
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

  it("flags $HOME/.ssh, /root/.ssh, and /home/<user>/.ssh the same as ~/.ssh", () => {
    expect(isSensitivePath("$HOME/.ssh/authorized_keys")).toBe(true);
    expect(isSensitivePath("/root/.ssh/authorized_keys")).toBe(true);
    expect(isSensitivePath("/root/.ssh/id_rsa")).toBe(true);
    expect(isSensitivePath("/home/alice/.ssh/authorized_keys")).toBe(true);
  });

  it("flags rc files under $HOME, /root, and /home/<user> the same as ~", () => {
    expect(isSensitivePath("$HOME/.bashrc")).toBe(true);
    expect(isSensitivePath("/root/.bashrc")).toBe(true);
    expect(isSensitivePath("/home/alice/.zshrc")).toBe(true);
  });
});
