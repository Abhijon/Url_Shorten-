type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Lightweight structured logger.
 * Swap for pino/winston later without changing call sites.
 */
function log(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

  if (meta === undefined) {
    console[level === 'debug' ? 'log' : level](`${prefix} ${message}`);
    return;
  }

  console[level === 'debug' ? 'log' : level](`${prefix} ${message}`, meta);
}

export const logger = {
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
  debug: (message: string, meta?: unknown) => log('debug', message, meta),
};
