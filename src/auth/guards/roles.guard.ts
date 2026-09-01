import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

// ── AVISO ────────────────────────────────────────────────────────────────
// Este guard compara @Roles(...) contra req.user.companyRole. Pero
// JwtStrategy.validate() (ver ../strategies/jwt.strategy.ts) NUNCA llena
// companyRole — solo trae lo que hay en el JWT (id, email, nombre).
//
// Tal como está, cualquier ruta con @Roles(...) va a fallar siempre
// (companyRole queda undefined) salvo que agregues un interceptor o
// middleware que llame a InnlabApiService.getUserContext(user.id) y
// fusione el resultado en req.user ANTES de que este guard se ejecute.
//
// Foresight tiene este mismo guard registrado globalmente y con el mismo
// gap sin cerrar — inclúyelo si tu producto va a necesitar roles por
// empresa, pero no asumas que funciona out-of-the-box: cierra el enriquecido
// de contexto primero (ver GUIDE.md).
// ────────────────────────────────────────────────────────────────────────
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return false;

    const userRoles = [user.companyRole].filter(Boolean) as string[];
    return requiredRoles.every((role) => userRoles.includes(role));
  }
}
