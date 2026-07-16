import { describe, expect, it } from "vitest";
import { TokenizeError, tokenize } from "../src/core/tokenizer";

describe("tokenize", () => {
  it("splits a simple pipeline into words and an operator", () => {
    const tokens = tokenize("curl http://x | sudo bash");
    expect(tokens.map((t) => t.value)).toEqual(["curl", "http://x", "|", "sudo", "bash"]);
    expect(tokens.map((t) => t.type)).toEqual(["word", "word", "pipe", "word", "word"]);
  });

  it("returns an empty token list for an empty string", () => {
    expect(tokenize("")).toEqual([]);
  });

  it("returns an empty token list for whitespace only", () => {
    expect(tokenize("   \t  ")).toEqual([]);
  });

  it("tokenizes double-quoted arguments as a single word, stripping quotes", () => {
    const tokens = tokenize('echo "a b"');
    expect(tokens.map((t) => t.value)).toEqual(["echo", "a b"]);
  });

  it("tokenizes single-quoted arguments as a single word, stripping quotes", () => {
    const tokens = tokenize("echo 'a b'");
    expect(tokens.map((t) => t.value)).toEqual(["echo", "a b"]);
  });

  it("throws TokenizeError for an unterminated single quote", () => {
    expect(() => tokenize("echo 'unterminated")).toThrow(TokenizeError);
  });

  it("throws TokenizeError for an unterminated double quote", () => {
    expect(() => tokenize('echo "unterminated')).toThrow(TokenizeError);
  });

  it("recognizes ;, &&, and || as distinct operators", () => {
    const tokens = tokenize("a; b && c || d");
    expect(tokens.filter((t) => t.type !== "word").map((t) => t.type)).toEqual([
      "semi",
      "and-if",
      "or-if",
    ]);
  });

  it("recognizes >, >>, and < as redirect operators", () => {
    const tokens = tokenize("a > out.txt; b >> out.txt; c < in.txt");
    const redirects = tokens.filter((t) => t.type.startsWith("redirect"));
    expect(redirects.map((t) => t.type)).toEqual([
      "redirect-out",
      "redirect-append",
      "redirect-in",
    ]);
  });

  it("marks process substitution as an unsupported word instead of crashing", () => {
    const tokens = tokenize("diff <(cmd1) <(cmd2)");
    const subs = tokens.filter((t) => t.unsupported);
    expect(subs).toHaveLength(2);
    expect(subs[0].value).toBe("<(cmd1)");
  });

  it("skips comments to end of line", () => {
    const tokens = tokenize("echo hi # this is a comment");
    expect(tokens.map((t) => t.value)).toEqual(["echo", "hi"]);
  });

  it("preserves accurate start/end spans for each token", () => {
    const tokens = tokenize("rm -rf /");
    expect(tokens[0]).toMatchObject({ value: "rm", start: 0, end: 2 });
    expect(tokens[2]).toMatchObject({ value: "/", start: 7, end: 8 });
  });

  it("drops a numeric fd prefix glued to a redirect (2>err.log)", () => {
    const tokens = tokenize("cmd 2>err.log");
    expect(tokens.map((t) => t.value)).toEqual(["cmd", ">", "err.log"]);
    expect(tokens.map((t) => t.type)).toEqual(["word", "redirect-out", "word"]);
  });

  it("does not treat a spaced-out digit as a redirect fd prefix", () => {
    const tokens = tokenize("echo 2 > file");
    expect(tokens.map((t) => t.value)).toEqual(["echo", "2", ">", "file"]);
  });

  it("consumes fd-duplication (2>&1) as a no-op with no dangling operator", () => {
    const tokens = tokenize("cmd 2>&1");
    expect(tokens.map((t) => t.value)).toEqual(["cmd"]);
  });

  it("consumes bare fd-duplication (>&2) as a no-op", () => {
    const tokens = tokenize("cmd >&2");
    expect(tokens.map((t) => t.value)).toEqual(["cmd"]);
  });

  it("consumes input fd-duplication (<&3) as a no-op", () => {
    const tokens = tokenize("cmd <&3");
    expect(tokens.map((t) => t.value)).toEqual(["cmd"]);
  });

  it("recognizes &>file as a combined stdout+stderr redirect-out", () => {
    const tokens = tokenize("cmd &>file");
    expect(tokens.map((t) => t.value)).toEqual(["cmd", "&>", "file"]);
    expect(tokens.map((t) => t.type)).toEqual(["word", "redirect-out", "word"]);
  });

  it("recognizes &>>file as a combined stdout+stderr redirect-append", () => {
    const tokens = tokenize("cmd &>>file");
    expect(tokens.map((t) => t.value)).toEqual(["cmd", "&>>", "file"]);
    expect(tokens.map((t) => t.type)).toEqual(["word", "redirect-append", "word"]);
  });
});
