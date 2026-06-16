type LogLevel = "debug" | "info" | "warn" | "error";

type LogMetadata = Record<string, unknown>;

class Logger {
  debug(message: string, metadata: LogMetadata = {}): void {
    this.write("debug", message, metadata);
  }

  info(message: string, metadata: LogMetadata = {}): void {
    this.write("info", message, metadata);
  }

  warn(message: string, metadata: LogMetadata = {}): void {
    this.write("warn", message, metadata);
  }

  error(message: string, metadata: LogMetadata = {}): void {
    this.write("error", message, metadata);
  }

  private write(level: LogLevel, message: string, metadata: LogMetadata): void {
    const payload = {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...metadata,
    };

    const line = JSON.stringify(payload);

    if (level === "error") {
      console.error(line);
      return;
    }

    console.log(line);
  }
}

export const logger = new Logger();
