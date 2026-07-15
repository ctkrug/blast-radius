export type TokenType =
  | "word"
  | "pipe"
  | "semi"
  | "and-if"
  | "or-if"
  | "redirect-out"
  | "redirect-append"
  | "redirect-in"
  | "background";

export interface Token {
  type: TokenType;
  /** Decoded value: quote characters stripped, escapes resolved. */
  value: string;
  /** Byte offsets into the original source string (inclusive start, exclusive end). */
  start: number;
  end: number;
  /** Set when the word contains a construct the tokenizer doesn't fully understand. */
  unsupported?: boolean;
}

export class TokenizeError extends Error {
  position: number;

  constructor(message: string, position: number) {
    super(message);
    this.name = "TokenizeError";
    this.position = position;
  }
}

const OPERATOR_CHARS = new Set(["|", ";", "&", ">", "<"]);

function isWhitespace(ch: string): boolean {
  return ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
}

/**
 * Splits a shell command line into words and operator tokens.
 *
 * Intentionally small grammar (see docs/VISION.md non-goals): handles quoting,
 * pipelines/sequencing operators, redirects, and flags `<(...)` process
 * substitution as an unsupported word rather than parsing it.
 */
export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];

    if (isWhitespace(ch)) {
      i++;
      continue;
    }

    if (ch === "#") {
      // Comment: skip to end of line.
      while (i < n && source[i] !== "\n") i++;
      continue;
    }

    if (ch === "&" && source[i + 1] === "&") {
      tokens.push({ type: "and-if", value: "&&", start: i, end: i + 2 });
      i += 2;
      continue;
    }

    if (ch === "|" && source[i + 1] === "|") {
      tokens.push({ type: "or-if", value: "||", start: i, end: i + 2 });
      i += 2;
      continue;
    }

    if (ch === "|") {
      tokens.push({ type: "pipe", value: "|", start: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === ";") {
      tokens.push({ type: "semi", value: ";", start: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === "&") {
      tokens.push({ type: "background", value: "&", start: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === ">" && source[i + 1] === ">") {
      tokens.push({ type: "redirect-append", value: ">>", start: i, end: i + 2 });
      i += 2;
      continue;
    }

    if (ch === ">") {
      tokens.push({ type: "redirect-out", value: ">", start: i, end: i + 1 });
      i++;
      continue;
    }

    if (ch === "<" && source[i + 1] === "(") {
      // Process substitution: consume the balanced-paren group as one
      // unsupported word rather than attempting to parse its contents.
      const start = i;
      let depth = 0;
      i += 1;
      while (i < n) {
        if (source[i] === "(") depth++;
        if (source[i] === ")") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
        }
        i++;
      }
      tokens.push({
        type: "word",
        value: source.slice(start, i),
        start,
        end: i,
        unsupported: true,
      });
      continue;
    }

    if (ch === "<") {
      tokens.push({ type: "redirect-in", value: "<", start: i, end: i + 1 });
      i++;
      continue;
    }

    // Word: run until whitespace or an unquoted operator char, honoring quotes/escapes.
    const start = i;
    let value = "";
    let unsupported = false;
    while (i < n) {
      const c = source[i];

      if (isWhitespace(c)) break;
      if (OPERATOR_CHARS.has(c)) break;

      if (c === "'") {
        const closeIdx = source.indexOf("'", i + 1);
        if (closeIdx === -1) {
          throw new TokenizeError("Unterminated single quote", i);
        }
        value += source.slice(i + 1, closeIdx);
        i = closeIdx + 1;
        continue;
      }

      if (c === '"') {
        let j = i + 1;
        let buf = "";
        let closed = false;
        while (j < n) {
          const cj = source[j];
          if (cj === '"') {
            closed = true;
            j++;
            break;
          }
          if (
            cj === "\\" &&
            (source[j + 1] === '"' || source[j + 1] === "\\" || source[j + 1] === "$")
          ) {
            buf += source[j + 1];
            j += 2;
            continue;
          }
          buf += cj;
          j++;
        }
        if (!closed) {
          throw new TokenizeError("Unterminated double quote", i);
        }
        value += buf;
        i = j;
        continue;
      }

      if (c === "\\" && i + 1 < n) {
        value += source[i + 1];
        i += 2;
        continue;
      }

      if (c === "$" && source[i + 1] === "(") {
        // Command substitution: not modeled — consume it and mark unsupported.
        let depth = 0;
        let j = i + 1;
        while (j < n) {
          if (source[j] === "(") depth++;
          if (source[j] === ")") {
            depth--;
            if (depth === 0) {
              j++;
              break;
            }
          }
          j++;
        }
        value += source.slice(i, j);
        unsupported = true;
        i = j;
        continue;
      }

      value += c;
      i++;
    }

    tokens.push({ type: "word", value, start, end: i, unsupported: unsupported || undefined });
  }

  return tokens;
}
