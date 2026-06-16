export class ApiError extends Error {
  public readonly status: number;
  public readonly code?: string;

  public constructor(
    message: string,
    status: number,
    code?: string
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

type QueryValue = string | number | boolean | null | undefined;

export class HttpClient {
  private readonly baseUrl: string;
  private readonly tokenProvider: () => string | null;

  public constructor(
    baseUrl: string,
    tokenProvider: () => string | null
  ) {
    this.baseUrl = baseUrl;
    this.tokenProvider = tokenProvider;
  }

  public get<T>(path: string, query?: Record<string, QueryValue>): Promise<T> {
    return this.request<T>(path, { method: "GET" }, query);
  }

  public post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>(path, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: "DELETE" });
  }

  private async request<T>(
    path: string,
    init: RequestInit,
    query?: Record<string, QueryValue>
  ): Promise<T> {
    const response = await fetch(this.buildUrl(path, query), {
      ...init,
      headers: this.buildHeaders(init.headers),
    });

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") ?? "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    if (!response.ok) {
      throw this.toApiError(payload, response.status);
    }

    return payload as T;
  }

  private buildUrl(path: string, query?: Record<string, QueryValue>): string {
    const url = new URL(`${this.baseUrl}${path}`);

    Object.entries(query ?? {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  }

  private buildHeaders(headers?: HeadersInit): HeadersInit {
    const token = this.tokenProvider();
    const nextHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...(headers as Record<string, string> | undefined),
    };

    if (token) {
      nextHeaders.Authorization = `Bearer ${token}`;
    }

    return nextHeaders;
  }

  private toApiError(payload: unknown, status: number): ApiError {
    if (typeof payload === "object" && payload !== null) {
      const record = payload as Record<string, unknown>;
      const message = String(record.message ?? record.error ?? "Error inesperado de API");
      const code = record.code ? String(record.code) : undefined;
      return new ApiError(message, status, code);
    }

    return new ApiError(String(payload || "Error inesperado de API"), status);
  }
}
