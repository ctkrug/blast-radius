export type Severity = "safe" | "caution" | "danger";

export interface Span {
  start: number;
  end: number;
}

export interface Finding {
  severity: Severity;
  reason: string;
  /** Source offsets of the part of the command this finding applies to. */
  span?: Span;
}

export interface Verdict {
  overall: Severity;
  findings: Finding[];
  /** Set when the input couldn't be fully parsed; findings explain why. */
  parseError?: string;
}
