import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PRODUCT_ROLES_KEY } from '../decorators/product-roles.decorator';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { InnlabApiService } from '../../innlab-api/innlab-api.service';
import type { ProductRoleName } from '../../innlab-api/interfaces/innlab-user.interface';

// Exige que el usuario sea staff del Innlab con alguno de los roles de
// @ProductRoles(...) en ESTE producto.
//
// A diferencia de RolesGuard, este funciona tal cual: en cada request a una
// ruta marcada le pregunta el rol a Core (/internal/users/:id/product-role).
// Las rutas sin @ProductRoles() no generan ninguna llamada.
//
// Core responde role: null para clientes, cuentas deshabilitadas y
// productos archivados, así que esos casos se rechazan sin lógica extra
// aquí. Por eso mismo no conviene cachear la respuesta mucho tiempo: es lo
// único que le corta el acceso a un staff deshabilitado mientras su access
// token siga vigente.
@Injectable()
export class ProductRoleGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly innlabApi: InnlabApiService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<ProductRoleName[]>(PRODUCT_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;
    if (!user) return false;

    const { role } = await this.innlabApi.getUserProductRole(user.id);
    if (!role || !requiredRoles.includes(role)) {
      throw new ForbiddenException('Insufficient product role');
    }

    user.productRole = role;
    return true;
  }
}
