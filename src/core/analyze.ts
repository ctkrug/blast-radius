import { ParseError, parseTokens } from "./parser";
import { commandRules, pipelineRules } from "./rules";
import { maxSeverity, runRules } from "./risk-engine";
import { TokenizeError, tokenize } from "./tokenizer";
import type { Token } from "./tokenizer";
import type { Finding, Verdict } from "./types";

// Bounds how many trailing tokens we'll drop while looking for a parseable
// prefix after a parse error. Small on purpose: a malformed trailing
// fragment (a stray ";;", a dangling redirect, an unterminated quote) is
// normally a handful of tokens, and this keeps worst-case retry cost flat
// regardless of how large the overall script is.
const MAX_SALVAGE_TRIM = 20;

/**
 * After a parse error, looks for the longest parseable prefix by dropping
 * trailing tokens, so a dangerous command earlier in the script still gets
 * flagged instead of trailing garbage collapsing the whole verdict to a
 * generic caution.
 */
function salvageFindingsFromTokens(tokens: Token[]): Finding[] {
  const maxTrim = Math.min(tokens.length, MAX_SALVAGE_TRIM);
  for (let trim = 0; trim <= maxTrim; trim++) {
    try {
      const script = parseTokens(tokens.slice(0, tokens.length - trim));
      return runRules(script, commandRules, pipelineRules);
    } catch {
      continue;
    }
  }
  return [];
}

/** Same salvage attempt, starting from a raw command string (used when tokenize itself failed). */
function salvageFindingsFromCommand(command: string): Finding[] {
  try {
    return salvageFindingsFromTokens(tokenize(command));
  } catch {
    return [];
  }
}

function degradedVerdict(err: TokenizeError | ParseError, salvaged: Finding[]): Verdict {
  const findings: Finding[] = [
    ...salvaged,
    {
      severity: "caution",
      reason: `Couldn't fully parse this command (${err.message}) — treat it with extra caution.`,
    },
  ];
  return { overall: maxSeverity(findings), findings, parseError: err.message };
}

/**
 * Parses a shell command line and runs the risk rule engine over it.
 * Never throws: a tokenize/parse failure (e.g. an unterminated quote)
 * surfaces as a caution finding instead of an exception reaching the UI.
 */
export function analyze(command: string): Verdict {
  let tokens: Token[];
  try {
    tokens = tokenize(command);
  } catch (err) {
    if (err instanceof TokenizeError) {
      return degradedVerdict(err, salvageFindingsFromCommand(command.slice(0, err.position)));
    }
    throw err;
  }

  try {
    const script = parseTokens(tokens);
    const findings = runRules(script, commandRules, pipelineRules);
    return { overall: maxSeverity(findings), findings };
  } catch (err) {
    if (err instanceof ParseError) {
      return degradedVerdict(err, salvageFindingsFromTokens(tokens));
    }
    throw err;
  }
}
