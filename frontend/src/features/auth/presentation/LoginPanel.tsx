import { LockKeyhole, LogIn, Mail, Server } from "lucide-react";
import { useState, type FormEvent } from "react";

import { NeonButton } from "../../../shared/presentation/components/neon-button";
import type { LoginCredentials } from "../domain/auth-session.entity";

interface LoginPanelProps {
  apiBaseUrl: string;
  error: string | null;
  isLoading: boolean;
  onLogin: (credentials: LoginCredentials) => Promise<void>;
}

export function LoginPanel({ apiBaseUrl, error, isLoading, onLogin }: LoginPanelProps) {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    email: "owner@autogmail.local",
    password: "Password123!",
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onLogin(credentials);
  }

  return (
    <main className="login-screen">
      <div className="login-screen__visual" aria-hidden="true">
        <div className="neon-orbit neon-orbit--one" />
        <div className="neon-orbit neon-orbit--two" />
        <div className="neon-core">
          <Mail size={54} />
        </div>
        <div className="packet packet--a" />
        <div className="packet packet--b" />
        <div className="packet packet--c" />
      </div>

      <form className="login-panel" onSubmit={handleSubmit}>
        <div className="login-panel__brand">
          <span className="brand-mark">
            <Server size={22} />
          </span>
          <div>
            <p>Auto-Gmail Code</p>
            <strong>Neon Control</strong>
          </div>
        </div>

        <label>
          <span>Email</span>
          <div className="input-shell">
            <Mail size={18} />
            <input
              autoComplete="email"
              type="email"
              value={credentials.email}
              onChange={(event) => setCredentials((current) => ({ ...current, email: event.target.value }))}
            />
          </div>
        </label>

        <label>
          <span>Password</span>
          <div className="input-shell">
            <LockKeyhole size={18} />
            <input
              autoComplete="current-password"
              type="password"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
            />
          </div>
        </label>

        {error ? <p className="form-error">{error}</p> : null}

        <NeonButton disabled={isLoading} icon={<LogIn size={18} />} type="submit">
          {isLoading ? "Conectando" : "Entrar"}
        </NeonButton>

        <p className="api-target">{apiBaseUrl}</p>
      </form>
    </main>
  );
}
