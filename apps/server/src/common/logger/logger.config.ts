import { LoggerOptions } from 'pino';

export const loggerConfig: LoggerOptions = {
  level: process.env.LOG_LEVEL || 'info',
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    req: () => {
      return undefined; // Don't log full request objects
    },
    res: () => {
      return undefined; // Don't log full response objects
    },
  },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.token',
      'req.body.secret',
      'req.body.apiKey',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
};
