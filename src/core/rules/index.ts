import type { CommandRule, PipelineRule } from "../risk-engine";
import { destructiveFsRule } from "./destructive-fs";

/**
 * Central registry of risk rules. Each rule module (Epic 2) registers itself
 * here; the engine has no built-in knowledge of any specific danger pattern.
 */
export const commandRules: CommandRule[] = [destructiveFsRule];
export const pipelineRules: PipelineRule[] = [];
