import type { CommandRule } from "../risk-engine";
import { destructiveFsRule } from "./destructive-fs";

/**
 * Command-level rules that apply standalone AND get re-run against the
 * inner command when wrapped in sudo (see sudo-scope.ts), so severity
 * compounds correctly instead of every sudo call reading the same caution.
 */
export const baseCommandRules: CommandRule[] = [destructiveFsRule];
