import type { ReactNode } from "react";

interface SectionPanelProps {
  title: string;
  eyebrow: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionPanel({ title, eyebrow, action, children }: SectionPanelProps) {
  return (
    <section className="section-panel">
      <header className="section-panel__header">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        {action ? <div className="section-panel__action">{action}</div> : null}
      </header>
      {children}
    </section>
  );
}
