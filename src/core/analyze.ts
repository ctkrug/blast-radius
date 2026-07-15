import { ParseError, parseTokens } from "./parser";
import { commandRules, pipelineRules } from "./rules";
import { maxSeverity, runRules } from "./risk-engine";
import { TokenizeError, tokenize } from "./tokenizer";
import type { Verdict } from "./types";

/**
 * Parses a shell command line and runs the risk rule engine over it.
 * Never throws: a tokenize/parse failure (e.g. an unterminated quote)
 * surfaces as a caution finding instead of an exception reaching the UI.
 */
export function analyze(command: string): Verdict {
  let script;
  try {
    script = parseTokens(tokenize(command));
  } catch (err) {
    if (err instanceof TokenizeError || err instanceof ParseError) {
      return {
        overall: "caution",
        findings: [
          {
            severity: "caution",
            reason: `Couldn't fully parse this command (${err.message}) — treat it with extra caution.`,
          },
        ],
        parseError: err.message,
      };
    }
    throw err;
  }

  const findings = runRules(script, commandRules, pipelineRules);
  return { overall: maxSeverity(findings), findings };
}
