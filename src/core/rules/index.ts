import type { CommandRule, PipelineRule } from "../risk-engine";
import { baseCommandRules } from "./registry";
import { remoteFetchExecRule } from "./remote-fetch-exec";
import { sudoScopeRule } from "./sudo-scope";
import { unsupportedSyntaxRule } from "./unsupported-syntax";

/**
 * Central registry of risk rules. Each rule module (Epic 2) registers itself
 * here; the engine has no built-in knowledge of any specific danger pattern.
 */
export const commandRules: CommandRule[] = [...baseCommandRules, sudoScopeRule, unsupportedSyntaxRule];
export const pipelineRules: PipelineRule[] = [remoteFetchExecRule];
