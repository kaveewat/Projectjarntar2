require('dotenv').config();
const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().port().default(5001),

  // Database
  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().port().default(3306),
  DB_NAME: Joi.string().default('efootball_db'),
  DB_USER: Joi.string().default('efootball_user'),
  DB_PASSWORD: Joi.string().allow('').default('efootball_pass'),
  DB_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
  DB_POOL_MIN: Joi.number().integer().min(0).default(2),
  DB_POOL_MAX: Joi.number().integer().min(1).default(10),

  // JWT
  JWT_SECRET: Joi.string()
    .min(32)
    .default('efootball_secret_key_dev_minimum_32_characters_long')
    .description('JWT secret key with minimum 32 characters'),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  REFRESH_TOKEN_SECRET: Joi.string()
    .min(32)
    .default('efootball_refresh_secret_dev_minimum_32_characters_long'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('30d'),

  // CORS
  CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
  FRONTEND_ORIGIN: Joi.string().default('http://localhost:5173'),

  // Security
  HANDOVER_ENCRYPTION_KEY: Joi.string().allow('').optional(),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),
}).unknown(true);

const { error, value: envVars } = envSchema.validate(process.env, {
  abortEarly: false,
});

if (error) {
  const errorDetails = error.details.map((d) => d.message).join(', ');
  throw new Error(`[Config Validation Error] Missing or invalid environment variables: ${errorDetails}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  db: {
    host: envVars.DB_HOST,
    port: envVars.DB_PORT,
    name: envVars.DB_NAME,
    user: envVars.DB_USER,
    password: envVars.DB_PASSWORD,
    ssl: envVars.DB_SSL ? { rejectUnauthorized: false } : undefined,
    connectionLimit: envVars.DB_POOL_MAX,
    waitForConnections: true,
    queueLimit: 0,
    connectTimeout: 10000,
  },
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.REFRESH_TOKEN_SECRET,
    refreshExpiresIn: envVars.REFRESH_TOKEN_EXPIRES_IN,
  },
  cors: {
    origin: envVars.CORS_ORIGIN || envVars.FRONTEND_ORIGIN,
  },
  encryption: {
    handoverKey: envVars.HANDOVER_ENCRYPTION_KEY,
  },
  logLevel: envVars.LOG_LEVEL,
};
