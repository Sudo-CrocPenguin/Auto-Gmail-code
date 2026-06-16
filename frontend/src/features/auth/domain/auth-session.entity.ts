export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role?: string;
}

export interface Workspace {
  id: string;
  name: string;
  plan?: string;
}

export interface AuthSession {
  accessToken: string;
  user: AuthUser;
  workspace: Workspace;
}

export interface LoginCredentials {
  email: string;
  password: string;
}
