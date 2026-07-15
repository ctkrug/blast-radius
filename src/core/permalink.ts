const PARAM = "c";

/** Encodes a command into a URL hash fragment (e.g. "#c=curl%20..."). */
export function encodeCommandToHash(command: string): string {
  return `#${PARAM}=${encodeURIComponent(command)}`;
}

/** Recovers the command from a URL hash fragment, or null if none is present. */
export function decodeCommandFromHash(hash: string): string | null {
  const trimmed = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(trimmed);
  const value = params.get(PARAM);
  return value === null || value === "" ? null : value;
}
