import { commandWords, type CommandNode } from "../ast";
import type { CommandRule } from "../risk-engine";
import type { Finding } from "../types";
import { isCatastrophicTarget } from "./paths";

function isFlag(word: string): boolean {
  return word.startsWith("-");
}

function rmFinding(cmd: CommandNode, words: string[]): Finding[] {
  const rest = words.slice(1);
  const flags = rest.filter(isFlag);
  const targets = rest.filter((w) => !isFlag(w));
  const recursive = flags.some((f) => /^-\w*[rR]\w*$/.test(f) || f === "--recursive");
  const forced = flags.some((f) => /^-\w*f\w*$/.test(f) || f === "--force");

  if (!recursive || targets.length === 0) return [];

  const span = { start: cmd.start, end: cmd.end };
  const catastrophic = targets.some(isCatastrophicTarget);

  if (catastrophic) {
    return [
      {
        severity: "danger",
        reason: `Recursively deletes ${targets.join(", ")} — an entire filesystem root or home directory, with no way back.`,
        span,
      },
    ];
  }

  return [
    {
      severity: "caution",
      reason: `Recursively ${forced ? "force-" : ""}deletes ${targets.join(", ")}.`,
      span,
    },
  ];
}

function mkfsFinding(cmd: CommandNode, words: string[]): Finding[] {
  const rest = words.slice(1);
  const target = [...rest].reverse().find((w) => !isFlag(w));
  return [
    {
      severity: "danger",
      reason: `Formats a filesystem${target ? ` on ${target}` : ""}, destroying all data there.`,
      span: { start: cmd.start, end: cmd.end },
    },
  ];
}

function ddFinding(cmd: CommandNode, words: string[]): Finding[] {
  const ofArg = words.slice(1).find((w) => w.startsWith("of="));
  if (!ofArg) return [];
  const target = ofArg.slice(3);
  if (!target.startsWith("/dev/")) return [];
  return [
    {
      severity: "danger",
      reason: `Writes raw data directly to device ${target}, which can silently destroy a disk or partition.`,
      span: { start: cmd.start, end: cmd.end },
    },
  ];
}

/** Flags destructive filesystem operations: recursive rm, mkfs, and dd writing to a raw device. */
export const destructiveFsRule: CommandRule = (cmd) => {
  const words = commandWords(cmd);
  if (words.length === 0) return [];
  const name = words[0];

  if (name === "rm") return rmFinding(cmd, words);
  if (name === "mkfs" || name.startsWith("mkfs.")) return mkfsFinding(cmd, words);
  if (name === "dd") return ddFinding(cmd, words);
  return [];
};
