import { SetMetadata } from '@nestjs/common';

// @Roles('owner') en un controller/handler exige ese companyRole
// (owner | admin | member): el rol de un cliente dentro de su empresa.
// Requiere que req.user.companyRole esté lleno — ver el aviso en
// RolesGuard antes de depender de esto en producción.
// Para el staff del Innlab usa @ProductRoles(), que sí funciona tal cual.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
