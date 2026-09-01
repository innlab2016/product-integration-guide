import { SetMetadata } from '@nestjs/common';

// Marca una ruta como exenta del guard JWT global.
// Úsalo en health checks, webhooks públicos, o el endpoint que recibe
// el ?code= del SSO si decides resolverlo del lado del backend.
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
