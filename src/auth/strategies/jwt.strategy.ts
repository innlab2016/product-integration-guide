import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { CognitoJwtPayload } from '../interfaces/jwt-payload.interface';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// Valida el access token contra el JWKS público de Cognito.
// No llama a Innlab Core ni a Cognito por red en cada request: jwks-rsa
// cachea las claves públicas, así que la validación es local y rápida.
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: configService.get<string>('cognito.jwksUri')!,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: configService.get<string>('cognito.issuer'),
      algorithms: ['RS256'],
    });
  }

  // Lo que retorna esta función queda disponible como req.user.
  // Deliberadamente NO incluye companyId/companyRole — eso vive en Core,
  // no en el token. Pídelo con InnlabApiService cuando lo necesites.
  validate(payload: CognitoJwtPayload): AuthenticatedUser {
    return {
      id: payload.sub,
      email: payload.email,
      firstName: payload.given_name,
      lastName: payload.family_name,
    };
  }
}
