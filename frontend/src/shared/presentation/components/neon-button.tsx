import type { ButtonHTMLAttributes, ReactNode } from "react";

interface NeonButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: "primary" | "secondary" | "danger";
}

export function NeonButton({
  children,
  icon,
  variant = "primary",
  className = "",
  ...props
}: NeonButtonProps) {
  return (
    <button className={`neon-button neon-button--${variant} ${className}`} type="button" {...props}>
      {icon ? <span className="neon-button__icon">{icon}</span> : null}
      <span>{children}</span>
    </button>
  );
}
