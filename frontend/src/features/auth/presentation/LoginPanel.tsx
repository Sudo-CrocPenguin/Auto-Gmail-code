import { Building2, CheckCircle2, LockKeyhole, LogIn, Mail, Server, User, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";

import { NeonButton } from "../../../shared/presentation/components/neon-button";
import type { LoginCredentials, RegisterCredentials } from "../domain/auth-session.entity";

interface LoginPanelProps {
  apiBaseUrl: string;
  error: string | null;
  isLoading: boolean;
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  onRegister: (credentials: RegisterCredentials) => Promise<void>;
}

type AuthMode = "login" | "register";

const emptyLogin: LoginCredentials = {
  email: "",
  password: "",
};

const emptyRegister: RegisterCredentials = {
  name: "",
  email: "",
  password: "",
  workspaceName: "",
  acceptTerms: false,
};

export function LoginPanel({ apiBaseUrl, error, isLoading, onLogin, onRegister }: LoginPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [credentials, setCredentials] = useState<LoginCredentials>(emptyLogin);
  const [registration, setRegistration] = useState<RegisterCredentials>(emptyRegister);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (mode === "register") {
      await onRegister(registration);
      return;
    }

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
            <strong>{mode === "register" ? "Crear workspace" : "Neon Control"}</strong>
          </div>
        </div>

        <div className="auth-mode" role="tablist" aria-label="Modo de autenticacion">
          <button
            aria-selected={mode === "login"}
            onClick={() => setMode("login")}
            role="tab"
            type="button"
          >
            <LogIn size={16} />
            Entrar
          </button>
          <button
            aria-selected={mode === "register"}
            onClick={() => setMode("register")}
            role="tab"
            type="button"
          >
            <UserPlus size={16} />
            Crear cuenta
          </button>
        </div>

        {mode === "register" ? (
          <>
            <label>
              <span>Nombre</span>
              <div className="input-shell">
                <User size={18} />
                <input
                  autoComplete="name"
                  required
                  value={registration.name}
                  onChange={(event) => setRegistration((current) => ({ ...current, name: event.target.value }))}
                />
              </div>
            </label>

            <label>
              <span>Workspace</span>
              <div className="input-shell">
                <Building2 size={18} />
                <input
                  required
                  value={registration.workspaceName}
                  onChange={(event) =>
                    setRegistration((current) => ({ ...current, workspaceName: event.target.value }))
                  }
                />
              </div>
            </label>
          </>
        ) : null}

        <label>
          <span>Email</span>
          <div className="input-shell">
            <Mail size={18} />
            <input
              autoComplete="email"
              required
              type="email"
              value={mode === "register" ? registration.email : credentials.email}
              onChange={(event) => {
                const email = event.target.value;
                setCredentials((current) => ({ ...current, email }));
                setRegistration((current) => ({ ...current, email }));
              }}
            />
          </div>
        </label>

        <label>
          <span>Password</span>
          <div className="input-shell">
            <LockKeyhole size={18} />
            <input
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={mode === "register" ? 8 : 1}
              required
              type="password"
              value={mode === "register" ? registration.password : credentials.password}
              onChange={(event) => {
                const password = event.target.value;
                setCredentials((current) => ({ ...current, password }));
                setRegistration((current) => ({ ...current, password }));
              }}
            />
          </div>
        </label>

        {mode === "register" ? (
          <label className="terms-row">
            <input
              checked={registration.acceptTerms}
              required
              type="checkbox"
              onChange={(event) =>
                setRegistration((current) => ({ ...current, acceptTerms: event.target.checked }))
              }
            />
            <span>Acepto los terminos del workspace</span>
          </label>
        ) : null}

        {error ? <p className="form-error">{error}</p> : null}

        <NeonButton
          disabled={isLoading}
          icon={mode === "register" ? <CheckCircle2 size={18} /> : <LogIn size={18} />}
          type="submit"
        >
          {isLoading ? "Procesando" : mode === "register" ? "Crear y entrar" : "Entrar"}
        </NeonButton>

        <p className="api-target">{apiBaseUrl}</p>
      </form>
    </main>
  );
}
