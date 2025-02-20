type LogLevel = 'info' | 'error' | 'warn' | 'debug';

function getTimestamp(): string {
  return new Date().toLocaleTimeString();
}

function log(level: LogLevel, message: string) {
  console.log(`${getTimestamp()} [express] ${message}`);
}

export const logger = {
  info: (message: string) => log('info', message),
  error: (message: string) => log('error', message),
  warn: (message: string) => log('warn', message),
  debug: (message: string) => log('debug', message),
};
