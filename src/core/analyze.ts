import type { Verdict } from "./types";

/**
 * Placeholder entry point for the risk engine. The real tokenizer, AST
 * parser, and rule set are built out story-by-story per docs/BACKLOG.md —
 * this stub only proves the paste -> analyze -> render pipeline is wired.
 */
export function analyze(command: string): Verdict {
  const trimmed = command.trim();

  if (trimmed.length === 0) {
    return { overall: "safe", findings: [] };
  }

  if (/\bsudo\b/.test(trimmed)) {
    return {
      overall: "caution",
      findings: [{ severity: "caution", reason: "Runs with root privileges (sudo)." }],
    };
  }

  return { overall: "safe", findings: [] };
}
