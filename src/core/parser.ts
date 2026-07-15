import type { CommandNode, PipelineNode, RedirectKind, ScriptNode, SequenceOperator, SequencePart } from "./ast";
import type { Token } from "./tokenizer";

export class ParseError extends Error {
  position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = "ParseError";
    this.position = position;
  }
}

const SEPARATOR_TYPES = new Set(["pipe", "semi", "and-if", "or-if", "background"]);
const REDIRECT_KINDS: Record<string, RedirectKind> = {
  "redirect-out": "write",
  "redirect-append": "append",
  "redirect-in": "read",
};

interface Cursor {
  i: number;
}

function parseCommand(tokens: Token[], cur: Cursor): CommandNode {
  const words: CommandNode["words"] = [];
  const redirects: CommandNode["redirects"] = [];
  let hasUnsupportedSyntax = false;
  const start = tokens[cur.i]?.start ?? 0;
  let end = start;

  while (cur.i < tokens.length) {
    const t = tokens[cur.i];
    if (SEPARATOR_TYPES.has(t.type)) break;

    if (t.type in REDIRECT_KINDS) {
      const kind = REDIRECT_KINDS[t.type];
      const opTok = t;
      cur.i++;
      const targetTok = tokens[cur.i];
      if (!targetTok || targetTok.type !== "word") {
        throw new ParseError("Redirect operator is missing a target", opTok.end);
      }
      redirects.push({ kind, target: targetTok.value, start: opTok.start, end: targetTok.end });
      end = targetTok.end;
      cur.i++;
      continue;
    }

    // word
    words.push({ value: t.value, start: t.start, end: t.end, unsupported: t.unsupported });
    if (t.unsupported) hasUnsupportedSyntax = true;
    end = t.end;
    cur.i++;
  }

  if (words.length === 0 && redirects.length === 0) {
    throw new ParseError("Expected a command", start);
  }

  return { type: "command", words, redirects, hasUnsupportedSyntax, start, end };
}

function parsePipeline(tokens: Token[], cur: Cursor): PipelineNode {
  const start = tokens[cur.i]?.start ?? 0;
  const stages: CommandNode[] = [parseCommand(tokens, cur)];

  while (tokens[cur.i]?.type === "pipe") {
    cur.i++;
    stages.push(parseCommand(tokens, cur));
  }

  const end = stages[stages.length - 1].end;
  return { type: "pipeline", stages, start, end };
}

/** Parses a token stream into a script: pipelines joined by ;/&&/||/&. */
export function parseTokens(tokens: Token[]): ScriptNode {
  const parts: SequencePart[] = [];
  if (tokens.length === 0) return { type: "script", parts };

  const cur: Cursor = { i: 0 };
  while (cur.i < tokens.length) {
    const pipeline = parsePipeline(tokens, cur);

    let operatorAfter: SequenceOperator | null = null;
    const opTok = tokens[cur.i];
    if (opTok && SEPARATOR_TYPES.has(opTok.type) && opTok.type !== "pipe") {
      operatorAfter = opTok.value as SequenceOperator;
      cur.i++;
    }

    parts.push({ pipeline, operatorAfter });

    if (operatorAfter === null) break;
    if (cur.i >= tokens.length) break; // trailing separator (e.g. "a;") is valid, nothing follows
  }

  return { type: "script", parts };
}
