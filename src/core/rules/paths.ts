const CATASTROPHIC_TARGETS = new Set(["/", "~", "$HOME"]);
const CRITICAL_ROOTS = new Set([
  "/etc",
  "/usr",
  "/bin",
  "/sbin",
  "/boot",
  "/var",
  "/root",
  "/home",
  "/lib",
  "/opt",
]);

/** Collapses one or more trailing slashes so "/etc/" matches the same as "/etc". */
function stripTrailingSlashes(target: string): string {
  const stripped = target.replace(/\/+$/, "");
  return stripped === "" ? "/" : stripped;
}

/** True for paths whose removal/overwrite would take out an entire filesystem root or home directory. */
export function isCatastrophicTarget(target: string): boolean {
  const normalized = stripTrailingSlashes(target);
  if (CATASTROPHIC_TARGETS.has(normalized)) return true;
  if (CRITICAL_ROOTS.has(normalized)) return true;
  if (/^\/\*+$/.test(normalized)) return true;
  // A specific user's whole home directory (/home/alice) is exactly as
  // catastrophic as /root — just scoped to one non-root account.
  if (/^\/home\/[^/]+$/.test(normalized)) return true;

  // A wildcard that wipes everything inside a critical root or home
  // directory (/etc/*, /home/*, ~/*) is just as catastrophic as removing
  // the directory itself.
  const wildcardMatch = normalized.match(/^(.*)\/\*+$/);
  if (wildcardMatch) {
    const base = wildcardMatch[1] || "/";
    if (CATASTROPHIC_TARGETS.has(base) || CRITICAL_ROOTS.has(base)) return true;
  }

  return false;
}

const SENSITIVE_EXACT = new Set([
  "/etc/passwd",
  "/etc/shadow",
  "/etc/sudoers",
  "~/.ssh/authorized_keys",
  "~/.bashrc",
  "~/.bash_profile",
  "~/.zshrc",
  "~/.profile",
]);

// $HOME, /root, and /home/<user> are all just other spellings of "the home
// directory" — normalize any of them down to a "~/..." path so every check
// below only has to know about the tilde form.
const HOME_PREFIX = /^(~\/|\$HOME\/|\/root\/|\/home\/[^/]+\/)/;

function toHomeRelative(target: string): string | null {
  const match = target.match(HOME_PREFIX);
  return match ? `~/${target.slice(match[0].length)}` : null;
}

/** True for redirect targets under a security- or shell-startup-sensitive path. */
export function isSensitivePath(target: string): boolean {
  if (SENSITIVE_EXACT.has(target)) return true;
  if (target.startsWith("/etc/")) return true;

  const homeRelative = toHomeRelative(target);
  if (homeRelative !== null) {
    if (SENSITIVE_EXACT.has(homeRelative)) return true;
    if (homeRelative.startsWith("~/.ssh/")) return true;
  }

  return false;
}
