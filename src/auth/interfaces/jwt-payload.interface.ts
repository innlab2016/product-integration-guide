// Forma del JWT que emite el User Pool de Cognito compartido por Innlab.
// Estos son los claims estándar que necesitamos — Cognito incluye más,
// pero no los tipamos si no los usamos.
export interface CognitoJwtPayload {
  sub: string; // = id de usuario en Innlab Core (mismo valor en todos los productos)
  email: string;
  given_name?: string;
  family_name?: string;

  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
}
