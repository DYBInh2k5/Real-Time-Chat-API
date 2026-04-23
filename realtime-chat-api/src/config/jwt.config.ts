import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'dev-secret-key',
  expiresIn: process.env.JWT_EXPIRATION || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
}));

// Made with Bob
