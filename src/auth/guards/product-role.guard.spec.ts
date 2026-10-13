import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ProductRoleGuard } from './product-role.guard';
import { InnlabApiService } from '../../innlab-api/innlab-api.service';
import type { ProductRoleName } from '../../innlab-api/interfaces/innlab-user.interface';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

describe('ProductRoleGuard', () => {
  const getUserProductRole = jest.fn();

  function setup(required: ProductRoleName[] | undefined, user?: AuthenticatedUser) {
    const reflector = { getAllAndOverride: () => required } as unknown as Reflector;
    const innlabApi = { getUserProductRole } as unknown as InnlabApiService;
    const context = {
      getHandler: () => null,
      getClass: () => null,
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
    } as unknown as ExecutionContext;
    return { guard: new ProductRoleGuard(reflector, innlabApi), context };
  }

  const roleFromCore = (role: ProductRoleName | null) =>
    getUserProductRole.mockResolvedValue({ userId: 'u1', product: 'tu-producto', accountType: 'internal', role });

  beforeEach(() => getUserProductRole.mockReset());

  it('deja pasar las rutas sin @ProductRoles() y no llama a Core', async () => {
    const { guard, context } = setup(undefined, { id: 'u1', email: 'a@b.co' });
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getUserProductRole).not.toHaveBeenCalled();
  });

  it('acepta un rol incluido en los requeridos y lo deja en req.user', async () => {
    roleFromCore('staff');
    const user: AuthenticatedUser = { id: 'u1', email: 'a@b.co' };
    const { guard, context } = setup(['admin', 'staff'], user);
    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(getUserProductRole).toHaveBeenCalledWith('u1');
    expect(user.productRole).toBe('staff');
  });

  it('rechaza un rol que no está entre los requeridos', async () => {
    roleFromCore('staff');
    const { guard, context } = setup(['admin'], { id: 'u1', email: 'a@b.co' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza cuando Core responde role null (cliente, deshabilitado o sin rol)', async () => {
    roleFromCore(null);
    const { guard, context } = setup(['admin', 'staff'], { id: 'u1', email: 'a@b.co' });
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza si no hay usuario autenticado', async () => {
    const { guard, context } = setup(['admin'], undefined);
    await expect(guard.canActivate(context)).resolves.toBe(false);
    expect(getUserProductRole).not.toHaveBeenCalled();
  });
});
