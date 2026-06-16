const TOKEN_KEY = "auto-gmail.access-token";

export class BrowserTokenStorage {
  public read(): string | null {
    return window.localStorage.getItem(TOKEN_KEY);
  }

  public write(token: string): void {
    window.localStorage.setItem(TOKEN_KEY, token);
  }

  public clear(): void {
    window.localStorage.removeItem(TOKEN_KEY);
  }
}
