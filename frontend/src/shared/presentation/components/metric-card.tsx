import type { ReactNode } from "react";

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  detail: string;
  tone?: "cyan" | "magenta" | "green" | "amber";
}

export function MetricCard({ icon, label, value, detail, tone = "cyan" }: MetricCardProps) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <div className="metric-card__icon">{icon}</div>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  );
}
