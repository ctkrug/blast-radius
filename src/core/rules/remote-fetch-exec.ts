import { commandWords, type CommandNode, type PipelineNode } from "../ast";
import type { PipelineRule } from "../risk-engine";
import type { Finding } from "../types";

const FETCHERS = new Set(["curl", "wget"]);
const SHELLS = new Set(["bash", "sh", "zsh", "dash", "ksh", "csh", "tcsh"]);

function isFetcher(cmd: CommandNode): boolean {
  const words = commandWords(cmd);
  return words.length > 0 && FETCHERS.has(words[0]);
}

function fetchTarget(cmd: CommandNode): string | undefined {
  return commandWords(cmd)
    .slice(1)
    .find((w) => !w.startsWith("-"));
}

interface ShellInvocation {
  shell: string;
  viaSudo: boolean;
}

function shellInvocation(cmd: CommandNode): ShellInvocation | null {
  const words = commandWords(cmd);
  if (words.length === 0) return null;

  let i = 0;
  let viaSudo = false;
  if (words[i] === "sudo") {
    viaSudo = true;
    i++;
    while (i < words.length && words[i].startsWith("-")) i++;
  }

  const name = words[i];
  return name && SHELLS.has(name) ? { shell: name, viaSudo } : null;
}

/** Flags a pipeline stage that fetches remote content directly into a shell interpreter. */
export const remoteFetchExecRule: PipelineRule = (pipeline: PipelineNode): Finding[] => {
  const findings: Finding[] = [];
  const { stages } = pipeline;

  for (let i = 0; i < stages.length - 1; i++) {
    if (!isFetcher(stages[i])) continue;

    const shell = shellInvocation(stages[i + 1]);
    if (!shell) continue;

    const target = fetchTarget(stages[i]);
    const runner = shell.viaSudo ? `sudo ${shell.shell}` : shell.shell;
    const rootNote = shell.viaSudo ? " with root privileges" : "";

    findings.push({
      severity: "danger",
      reason: `Fetches${target ? ` ${target}` : " a remote script"} and pipes it straight into ${runner}, running whatever the server returns as code${rootNote}.`,
      span: { start: stages[i].start, end: stages[i + 1].end },
    });
  }

  return findings;
};
