import type { CommandRule } from "../risk-engine";

/**
 * Graceful degradation: a command using a construct the parser doesn't fully
 * model (process/command substitution) still gets analyzed for everything it
 * does understand, plus this explicit caution — never a silent false "safe".
 */
export const unsupportedSyntaxRule: CommandRule = (cmd) => {
  if (!cmd.hasUnsupportedSyntax) return [];

  return [
    {
      severity: "caution",
      reason:
        "Contains shell syntax this tool can't fully parse (e.g. process or command substitution) — couldn't fully analyze this part, so treat it with extra care.",
      span: { start: cmd.start, end: cmd.end },
    },
  ];
};
