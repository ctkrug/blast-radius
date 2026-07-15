import { commandWords, type CommandNode } from "../ast";
import type { CommandRule } from "../risk-engine";
import { maxSeverity } from "../risk-engine";
import { baseCommandRules } from "./registry";

const ROUTINE_ADMIN_COMMANDS = new Set([
  "apt",
  "apt-get",
  "apt-cache",
  "yum",
  "dnf",
  "pacman",
  "brew",
  "snap",
  "dpkg",
  "systemctl",
  "service",
  "update-alternatives",
  "npm",
  "pip",
  "pip3",
]);

/** Builds the synthetic command sudo would actually run, skipping sudo and its flags. */
function effectiveInnerCommand(cmd: CommandNode): CommandNode | null {
  const { words } = cmd;
  if (words.length === 0 || words[0].value !== "sudo") return null;

  let i = 1;
  while (i < words.length && words[i].value.startsWith("-")) i++;
  if (i >= words.length) return null;

  return {
    type: "command",
    words: words.slice(i),
    redirects: cmd.redirects,
    hasUnsupportedSyntax: cmd.hasUnsupportedSyntax,
    start: cmd.start,
    end: cmd.end,
  };
}

/**
 * Detects sudo/root scope and reflects it in severity rather than just
 * flagging the word "sudo": compounds to danger when the wrapped command is
 * itself destructive, otherwise reads as a routine or generic caution.
 */
export const sudoScopeRule: CommandRule = (cmd) => {
  const inner = effectiveInnerCommand(cmd);
  if (!inner) return [];

  const innerFindings = baseCommandRules.flatMap((rule) => rule(inner));
  const span = { start: cmd.start, end: cmd.end };

  if (maxSeverity(innerFindings) === "danger") {
    const reasons = innerFindings
      .filter((f) => f.severity === "danger")
      .map((f) => f.reason)
      .join(" ");
    return [
      {
        severity: "danger",
        reason: `Runs as root via sudo, compounding the danger: ${reasons}`,
        span,
      },
    ];
  }

  const innerName = commandWords(inner)[0];
  if (ROUTINE_ADMIN_COMMANDS.has(innerName)) {
    return [
      {
        severity: "caution",
        reason: `Runs '${innerName}' with root privileges (sudo) — routine for package/service management.`,
        span,
      },
    ];
  }

  return [{ severity: "caution", reason: "Runs with root privileges (sudo).", span }];
};
