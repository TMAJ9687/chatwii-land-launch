
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Get environment from import.meta.env or default to development
const isProd = import.meta.env.PROD === true;

class Logger {
  private context: string;
  private enabled: boolean = !isProd; // Disable logs in production by default

  constructor(context: string) {
    this.context = context;
  }

  // Enable or disable logging
  enable(enabled: boolean = true) {
    this.enabled = enabled;
    return this;
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): [string, ...any[]] {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}] [${this.context}]`;
    
    if (args.length === 0) {
      return [`${prefix} ${message}`];
    }
    
    return [`${prefix} ${message}`, ...args];
  }

  debug(message: string, ...args: any[]) {
    if (!this.enabled) return;
    console.debug(...this.formatMessage('debug', message, ...args));
  }

  info(message: string, ...args: any[]) {
    if (!this.enabled) return;
    console.info(...this.formatMessage('info', message, ...args));
  }

  warn(message: string, ...args: any[]) {
    // We always log warnings
    console.warn(...this.formatMessage('warn', message, ...args));
  }

  error(message: string, ...args: any[]) {
    // We always log errors
    console.error(...this.formatMessage('error', message, ...args));
  }
}

// Factory function to create logger instances
export const createLogger = (context: string) => new Logger(context);

// Default logger for quick access
export const logger = createLogger('app');
