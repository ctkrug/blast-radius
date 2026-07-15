import type { CommandRule } from "../risk-engine";
import type { Finding } from "../types";
import { isSensitivePath } from "./paths";

/** Flags redirects that write or append into a sensitive system/credential path. */
export const sensitiveRedirectRule: CommandRule = (cmd) => {
  const findings: Finding[] = [];

  for (const redirect of cmd.redirects) {
    if (redirect.kind === "read") continue;
    if (!isSensitivePath(redirect.target)) continue;

    const verb = redirect.kind === "append" ? "Appends to" : "Overwrites";
    findings.push({
      severity: "danger",
      reason: `${verb} ${redirect.target}, a sensitive system or credential file.`,
      span: { start: redirect.start, end: redirect.end },
    });
  }

  return findings;
};
