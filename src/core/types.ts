export type Severity = "safe" | "caution" | "danger";

export interface Finding {
  severity: Severity;
  reason: string;
}

export interface Verdict {
  overall: Severity;
  findings: Finding[];
}
