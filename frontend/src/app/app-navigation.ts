import { Bell, Gauge, Inbox, RadioTower, Settings, Workflow, type LucideIcon } from "lucide-react";

export type AppModule = "dashboard" | "gmail" | "emails" | "alerts" | "rules" | "settings";

export interface NavigationItem {
  id: AppModule;
  label: string;
  icon: LucideIcon;
}

export const navigationItems: NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", icon: Gauge },
  { id: "gmail", label: "Gmail", icon: RadioTower },
  { id: "emails", label: "Inbox", icon: Inbox },
  { id: "alerts", label: "Alertas", icon: Bell },
  { id: "rules", label: "Reglas", icon: Workflow },
  { id: "settings", label: "Sistema", icon: Settings },
];
