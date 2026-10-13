import { SetMetadata } from '@nestjs/common';
import type { ProductRoleName } from '../../innlab-api/interfaces/innlab-user.interface';

// @ProductRoles('admin') o @ProductRoles('admin', 'staff') en un
// controller/handler: exige ser staff del Innlab con uno de esos roles en
// este producto. No confundir con @Roles(), que es el rol de un cliente
// dentro de su empresa.
export const PRODUCT_ROLES_KEY = 'productRoles';
export const ProductRoles = (...roles: ProductRoleName[]) =>
  SetMetadata(PRODUCT_ROLES_KEY, roles);
