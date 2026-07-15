export interface Example {
  id: string;
  label: string;
  command: string;
}

/**
 * The wow-moment contrast pair (docs/VISION.md): a fetch-and-execute-as-root
 * danger next to a harmless everyday command, shown pre-analyzed on load so
 * the page proves its point before anyone types anything.
 */
export const EXAMPLES: Example[] = [
  {
    id: "danger",
    label: "Remote install script, run as root",
    command: "curl https://get.example.com/install.sh | sudo bash",
  },
  {
    id: "safe",
    label: "Everyday status check",
    command: "git status",
  },
];
