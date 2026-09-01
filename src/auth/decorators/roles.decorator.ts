import { SetMetadata } from '@nestjs/common';

// @Roles('owner') en un controller/handler exige ese companyRole.
// Requiere que req.user.companyRole esté lleno — ver el aviso en
// RolesGuard antes de depender de esto en producción.
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
