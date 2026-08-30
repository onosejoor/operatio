export const envConfig = {
  app: {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '', 10) || 3000,
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/operatio',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '', 10) || 6379,
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    accessTokenExpiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRES_IN || '15m',
    refreshTokenExpiresIn: process.env.JWT_REFRESH_TOKEN_EXPIRES_IN || '7d',
  },
  sendlib: {
    apiKey: process.env.SEND_LIB_API_KEY || '',
    from: process.env.SEND_LIB_FROM || 'Operatio <noreply@operatio.dev>',
  },
};

export type EnvConfig = typeof envConfig;
