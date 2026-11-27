export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3001', 10),
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me-now!!',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'dev-refresh-secret-change-me-now!',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  seedDemoData: process.env.SEED_DEMO_DATA !== 'false',
  integrations: {
    staleAfterHours: parseInt(process.env.PRICE_STALE_AFTER_HOURS ?? '24', 10),
    suspiciousChangePercent: parseInt(process.env.PRICE_SUSPICIOUS_CHANGE_PERCENT ?? '40', 10),
    amazon: {
      enabled: process.env.AMAZON_CREATORS_ENABLED === 'true',
      credentialId: process.env.AMAZON_CREDENTIAL_ID || undefined,
      credentialSecret: process.env.AMAZON_CREDENTIAL_SECRET || undefined,
      credentialVersion: process.env.AMAZON_CREDENTIAL_VERSION || '3.2',
      partnerTag: process.env.AMAZON_PARTNER_TAG || undefined,
      marketplace: process.env.AMAZON_MARKETPLACE || 'www.amazon.in',
    },
    flipkart: {
      enabled: process.env.FLIPKART_AFFILIATE_ENABLED === 'true',
      affiliateId: process.env.FLIPKART_AFFILIATE_ID || undefined,
      affiliateToken: process.env.FLIPKART_AFFILIATE_TOKEN || undefined,
    },
  },
});
