import { registerAs } from '@nestjs/config';

// Mismo User Pool que usa Innlab Core — no crear uno nuevo por producto.
export const cognitoConfig = registerAs('cognito', () => ({
  jwksUri: process.env.COGNITO_JWKS_URI,
  issuer: process.env.COGNITO_ISSUER,
}));
