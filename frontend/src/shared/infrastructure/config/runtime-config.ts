export interface RuntimeConfig {
  apiBaseUrl: string;
}

export const runtimeConfig: RuntimeConfig = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000/api",
};
