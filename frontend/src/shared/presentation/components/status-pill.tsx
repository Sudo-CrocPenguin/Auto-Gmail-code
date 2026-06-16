interface StatusPillProps {
  label: string;
  tone?: "cyan" | "magenta" | "green" | "amber" | "red";
}

export function StatusPill({ label, tone = "cyan" }: StatusPillProps) {
  return <span className={`status-pill status-pill--${tone}`}>{label}</span>;
}
