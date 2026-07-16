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

/** True for redirect targets under a security- or shell-startup-sensitive path. */
export function isSensitivePath(target: string): boolean {
  if (SENSITIVE_EXACT.has(target)) return true;
  if (target.startsWith("/etc/")) return true;
  if (target.startsWith("~/.ssh/")) return true;
  return false;
}
