import { commandWords } from "../ast";
import type { CommandRule } from "../risk-engine";

const FETCH_TOOLS = new Set(["curl", "wget"]);
const DATA_FLAGS = new Set([
  "-d",
  "--data",
  "--data-raw",
  "--data-binary",
  "--data-urlencode",
  "--data-ascii",
  "-F",
  "--form",
]);
const UPLOAD_FLAGS = new Set(["-T", "--upload-file"]);
// Common curl/wget flags that consume the next argument as a value rather
// than a target — without this, a value like a header or method name gets
// mistaken for the URL.
const VALUE_FLAGS = new Set([
  "-X",
  "--request",
  "-H",
  "--header",
  "-A",
  "--user-agent",
  "-e",
  "--referer",
  "-o",
  "--output",
  "-O",
  "--output-document",
  "-u",
  "--user",
  "-b",
  "--cookie",
  "-c",
  "--cookie-jar",
  "-x",
  "--proxy",
  "-w",
  "--write-out",
  "-K",
  "--config",
  "-E",
  "--cert",
  "--cacert",
  "--key",
  "--connect-timeout",
  "--max-time",
  "--retry",
  "--limit-rate",
  "--interface",
  "--resolve",
]);

function extractHost(urlLike: string): string {
  try {
    return new URL(urlLike).host || urlLike;
  } catch {
    return urlLike;
  }
}

/** Detects outbound network calls and, where data is attached, the exfiltration shape. */
export const networkExfilRule: CommandRule = (cmd) => {
  const words = commandWords(cmd);
  if (words.length === 0 || !FETCH_TOOLS.has(words[0])) return [];

  const rest = words.slice(1);
  const span = { start: cmd.start, end: cmd.end };

  let fileBackedData: string | null = null;
  let hasDataFlag = false;
  const consumedAsValue = new Set<number>();

  for (let i = 0; i < rest.length; i++) {
    const word = rest[i];
    if (DATA_FLAGS.has(word)) {
      hasDataFlag = true;
      consumedAsValue.add(i + 1);
      const value = rest[i + 1];
      if (value?.startsWith("@")) fileBackedData = value.slice(1);
    }
    if (UPLOAD_FLAGS.has(word)) {
      hasDataFlag = true;
      consumedAsValue.add(i + 1);
      fileBackedData = rest[i + 1] ?? fileBackedData;
    }
    if (VALUE_FLAGS.has(word)) {
      consumedAsValue.add(i + 1);
    }
  }

  const target = rest.find((w, i) => !w.startsWith("-") && !consumedAsValue.has(i)) ?? "";
  if (!target) return [];
  const host = extractHost(target);

  if (fileBackedData) {
    return [
      {
        severity: "danger",
        reason: `Sends the contents of ${fileBackedData} to ${host} — local data is leaving the machine.`,
        span,
      },
    ];
  }

  if (hasDataFlag) {
    return [{ severity: "caution", reason: `Sends data to ${host} as part of the request.`, span }];
  }

  return [{ severity: "caution", reason: `Makes an outbound network request to ${host}.`, span }];
};
