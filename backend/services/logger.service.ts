// Structured JSON Logging System
// In a real prod environment, this might wrap Winston or Pino.

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  [key: string]: any; // Additional structured data
}

export const logger = {
  log(level: LogLevel, message: string, meta: Record<string, any> = {}) {
    const payload: LogPayload = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...meta,
    };

    // Sanitize prompt logs if present to prevent logging PII
    if (payload.prompt && typeof payload.prompt === 'string') {
      payload.prompt = payload.prompt.length > 50 
        ? payload.prompt.substring(0, 50) + '... [TRUNCATED]' 
        : payload.prompt;
    }

    const logString = JSON.stringify(payload);
    
    switch (level) {
      case 'info':
        console.log(logString);
        break;
      case 'warn':
        console.warn(logString);
        break;
      case 'error':
        console.error(logString);
        break;
      case 'debug':
        console.debug(logString);
        break;
    }
  },

  info(message: string, meta?: Record<string, any>) {
    this.log('info', message, meta);
  },
  
  warn(message: string, meta?: Record<string, any>) {
    this.log('warn', message, meta);
  },

  error(message: string, meta?: Record<string, any>) {
    this.log('error', message, meta);
  },

  debug(message: string, meta?: Record<string, any>) {
    this.log('debug', message, meta);
  }
};
