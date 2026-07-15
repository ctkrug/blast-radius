import type { CommandRule } from "../risk-engine";
import { destructiveFsRule } from "./destructive-fs";
import { networkExfilRule } from "./network-exfil";
import { sensitiveRedirectRule } from "./sensitive-redirect";

/**
 * Command-level rules that apply standalone AND get re-run against the
 * inner command when wrapped in sudo (see sudo-scope.ts), so severity
 * compounds correctly instead of every sudo call reading the same caution.
 */
export const baseCommandRules: CommandRule[] = [
  destructiveFsRule,
  networkExfilRule,
  sensitiveRedirectRule,
];
