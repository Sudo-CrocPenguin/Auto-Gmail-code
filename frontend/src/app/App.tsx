import { useEffect, useMemo, useState } from "react";

import type { AuthSession, LoginCredentials } from "../features/auth/domain/auth-session.entity";
import { LoginPanel } from "../features/auth/presentation/LoginPanel";
import { ApiError } from "../shared/infrastructure/http/http-client";
import { createAppServices } from "./application/app-services";
import type { WorkspaceOverview } from "./application/workspace-overview.service";
import type { AppModule } from "./app-navigation";
import { CommandCenter } from "./presentation/CommandCenter";

const emptyOverview: WorkspaceOverview = {
  accounts: [],
  alerts: [],
  categories: [],
  emails: [],
  emailsByDay: [],
  rules: [],
  settings: null,
  summary: {},
  topSenders: [],
};

export function App() {
  const services = useMemo(() => createAppServices(), []);
  const initialToken = useMemo(() => services.tokenStorage.read(), [services]);
  const [activeModule, setActiveModule] = useState<AppModule>("dashboard");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(initialToken));
  const [overview, setOverview] = useState<WorkspaceOverview>(emptyOverview);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    if (!initialToken) {
      return;
    }

    services.authRepository
      .me()
      .then((identity) => {
        setSession({ ...identity, accessToken: initialToken });
        return services.overview.load();
      })
      .then(setOverview)
      .catch((cause) => {
        services.tokenStorage.clear();
        setError(toMessage(cause));
      })
      .finally(() => setIsLoading(false));
  }, [initialToken, services]);

  async function handleLogin(credentials: LoginCredentials) {
    setIsLoading(true);
    setError(null);

    try {
      const nextSession = await services.loginUser.execute(credentials);
      services.tokenStorage.write(nextSession.accessToken);
      setSession(nextSession);
      setOverview(await services.overview.load());
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleRefresh() {
    setIsLoading(true);
    setError(null);

    try {
      setOverview(await services.overview.load());
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setIsLoading(false);
    }
  }

  async function handleLogout() {
    setError(null);

    try {
      await services.logoutUser.execute();
    } catch {
      // La sesion local se limpia aunque el token remoto ya no sea valido.
    } finally {
      services.tokenStorage.clear();
      setSession(null);
      setOverview(emptyOverview);
    }
  }

  async function handleStartOAuth() {
    setError(null);

    try {
      const oauth = await services.gmailRepository.startOAuth();
      window.location.assign(oauth.authUrl);
    } catch (cause) {
      setError(toMessage(cause));
    }
  }

  async function handleSyncAccount(accountId: string) {
    setIsLoading(true);
    setError(null);

    try {
      await services.gmailRepository.sync(accountId);
      setOverview(await services.overview.load());
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setIsLoading(false);
    }
  }

  if (!session) {
    return (
      <LoginPanel
        apiBaseUrl={services.apiBaseUrl}
        error={error}
        isLoading={isLoading}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <CommandCenter
      activeModule={activeModule}
      apiBaseUrl={services.apiBaseUrl}
      error={error}
      isLoading={isLoading}
      overview={overview}
      session={session}
      onLogout={handleLogout}
      onRefresh={handleRefresh}
      onSetActiveModule={setActiveModule}
      onStartOAuth={handleStartOAuth}
      onSyncAccount={handleSyncAccount}
    />
  );
}

function toMessage(cause: unknown): string {
  if (cause instanceof ApiError) {
    return `${cause.status} - ${cause.message}`;
  }

  if (cause instanceof Error) {
    return cause.message;
  }

  return "No se pudo completar la operacion.";
}
