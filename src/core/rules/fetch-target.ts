/**
 * curl/wget flags that consume the next argument as a value rather than a
 * target — shared by network-exfil.ts and remote-fetch-exec.ts so neither
 * rule mistakes a header, method name, or output filename for the URL.
 */
export const VALUE_FLAGS = new Set([
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

/**
 * Finds the first argument that looks like the actual fetch target,
 * skipping flags and any value a flag in `extraValueFlags` consumes.
 */
export function findFetchTarget(
  args: string[],
  extraValueFlags: ReadonlySet<string> = new Set(),
): string | undefined {
  const consumed = new Set<number>();
  for (let i = 0; i < args.length; i++) {
    if (VALUE_FLAGS.has(args[i]) || extraValueFlags.has(args[i])) consumed.add(i + 1);
  }
  return args.find((w, i) => !w.startsWith("-") && !consumed.has(i));
}
