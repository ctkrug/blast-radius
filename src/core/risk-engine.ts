import type { CommandNode, PipelineNode, ScriptNode } from "./ast";
import type { Finding, Severity } from "./types";

export type CommandRule = (cmd: CommandNode) => Finding[];
export type PipelineRule = (pipeline: PipelineNode) => Finding[];

const SEVERITY_RANK: Record<Severity, number> = { safe: 0, caution: 1, danger: 2 };

export function maxSeverity(findings: Finding[]): Severity {
  let result: Severity = "safe";
  for (const f of findings) {
    if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[result]) result = f.severity;
  }
  return result;
}

/** Walks a parsed script, applying pipeline rules to each pipeline and command rules to each stage. */
export function runRules(
  script: ScriptNode,
  commandRules: CommandRule[],
  pipelineRules: PipelineRule[],
): Finding[] {
  const findings: Finding[] = [];

  for (const part of script.parts) {
    for (const rule of pipelineRules) {
      findings.push(...rule(part.pipeline));
    }
    for (const stage of part.pipeline.stages) {
      for (const rule of commandRules) {
        findings.push(...rule(stage));
      }
    }
  }

  return findings;
}
