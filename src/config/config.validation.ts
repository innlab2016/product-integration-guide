import * as Joi from 'joi';

// La app falla al arrancar si falta alguna de estas — mejor que fallar
// en el primer request a Cognito o a Core con un error críptico.
export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  API_GLOBAL_PREFIX: Joi.string().default('api'),
  CORS_ORIGINS: Joi.string().default('*'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_SSL: Joi.boolean().default(false),

  INNLAB_API_BASE_URL: Joi.string().uri().required(),
  INNLAB_API_TIMEOUT: Joi.number().default(5000),

  COGNITO_JWKS_URI: Joi.string().uri().required(),
  COGNITO_ISSUER: Joi.string().uri().required(),

  CORE_INTERNAL_KEY: Joi.string().required(),
});
