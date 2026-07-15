export interface WordSpan {
  value: string;
  start: number;
  end: number;
  unsupported?: boolean;
}

export type RedirectKind = "write" | "append" | "read";

export interface RedirectNode {
  kind: RedirectKind;
  target: string;
  start: number;
  end: number;
}

export interface CommandNode {
  type: "command";
  /** All words including the command name at index 0. */
  words: WordSpan[];
  redirects: RedirectNode[];
  /** True if any word contains a construct the tokenizer couldn't fully parse. */
  hasUnsupportedSyntax: boolean;
  start: number;
  end: number;
}

export interface PipelineNode {
  type: "pipeline";
  stages: CommandNode[];
  start: number;
  end: number;
}

export type SequenceOperator = ";" | "&&" | "||" | "&";

export interface SequencePart {
  pipeline: PipelineNode;
  /** Operator that follows this pipeline; null for the last part in the script. */
  operatorAfter: SequenceOperator | null;
}

export interface ScriptNode {
  type: "script";
  parts: SequencePart[];
}

export function commandWords(cmd: CommandNode): string[] {
  return cmd.words.map((w) => w.value);
}
