import { describe, expect, it } from "vitest";
import { commandWords } from "../src/core/ast";
import { ParseError, parseTokens } from "../src/core/parser";
import { tokenize } from "../src/core/tokenizer";

function parse(source: string) {
  return parseTokens(tokenize(source));
}

describe("parseTokens", () => {
  it("parses an empty token stream into a script with no parts", () => {
    expect(parse("")).toEqual({ type: "script", parts: [] });
  });

  it("parses a 3-stage pipeline", () => {
    const script = parse("a | b | c");
    expect(script.parts).toHaveLength(1);
    const { pipeline } = script.parts[0];
    expect(pipeline.stages).toHaveLength(3);
    expect(pipeline.stages.map((s) => commandWords(s)[0])).toEqual(["a", "b", "c"]);
  });

  it("parses write, append, and read redirects with typed metadata", () => {
    const write = parse("a > out.txt").parts[0].pipeline.stages[0];
    expect(write.redirects).toEqual([{ kind: "write", target: "out.txt", start: 2, end: 11 }]);

    const append = parse("a >> out.txt").parts[0].pipeline.stages[0];
    expect(append.redirects[0].kind).toBe("append");
    expect(append.redirects[0].target).toBe("out.txt");

    const read = parse("a < in.txt").parts[0].pipeline.stages[0];
    expect(read.redirects[0].kind).toBe("read");
    expect(read.redirects[0].target).toBe("in.txt");
  });

  it("parses a sequence of commands with the correct operator between them", () => {
    const script = parse("a && b || c; d");
    expect(script.parts.map((p) => p.operatorAfter)).toEqual(["&&", "||", ";", null]);
    expect(script.parts.map((p) => commandWords(p.pipeline.stages[0])[0])).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("allows a trailing separator with nothing after it", () => {
    const script = parse("a;");
    expect(script.parts).toHaveLength(1);
    expect(script.parts[0].operatorAfter).toBe(";");
  });

  it("throws ParseError when a redirect has no target", () => {
    expect(() => parse("a >")).toThrow(ParseError);
  });

  it("marks a command as having unsupported syntax when a word does", () => {
    const cmd = parse("diff <(cmd1) file").parts[0].pipeline.stages[0];
    expect(cmd.hasUnsupportedSyntax).toBe(true);
  });
});
